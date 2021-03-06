# @loopback/example-log-extension

An example repo showing how to write a complex log extension for LoopBack 4

## Overview

This repository shows you how to use [@loopback/cli](https://github.com/strongloop/loopback-next/tree/master/packages/cli)
to write a complex logging extension that requires a [Component](http://loopback.io/doc/en/lb4/Using-components.html),
[Decorator](http://loopback.io/doc/en/lb4/Decorators.html), and a [Mixin](http://loopback.io/doc/en/lb4/Mixin.html).

To use the extension, load the component to get access to a `LogFn` that can be
used in a sequence to log information. A Mixin allows you to set the
application wide logLevel. Only Controller methods configured at or above the
logLevel will be logged.

Possible levels are: DEBUG < INFO < WARN < ERROR < OFF

*Possible levels are represented as numbers but users can use `LOG_LEVEL.${level}`
to specify the value instead of using numbers.*

A decorator enables you to provide metadata for Controller methods to set the
minimum logLevel.

### Example Usage

```ts
import {
  LogLevelMixin,
  LogComponent,
  LOG_LEVEL,
  log
} from 'loopback4-example-log-extension';
// Other imports ...

class LogApp extends LogLevelMixin(Application) {
  constructor() {
    super({
      components: [RestComponent, LogComponent],
      logLevel: LOG_LEVEL.ERROR,
      controllers: [MyController]
    });
  };
}

class MyController {
  @log(LOG_LEVEL.WARN)
  @get('/')
  hello() {
    return 'Hello LoopBack';
  }

  @log(LOG_LEVEL.ERROR)
  @get('/name')
  helloName() {
    return 'Hello Name'
  }
}
```

## Cloning the example project locally

You can obtain a local clone of this project (without the rest of our monorepo)
using the following command:

```
lb4 example getting-started
```

## Tutorial

Install `@loopback/cli` by running `npm i -g @loopback/cli`.

Initialize your new extension project as follows:
`lb4 extension`

- Project name: `loopback4-example-log-extension`
- Project description: `An example extension project for LoopBack 4`
- Project root directory: `(loopback4-example-log-extension)`
- Component class name: `LogComponent`
- Select project build settings: `Enable tslint, Enable prettier, Enable mocha, Enable loopbackBuild`

Now you can write the extension as follows:

### `/src/keys.ts`
Define `Binding` keys here for the component as well as any constants for the
user (for this extension that'll be the logLevel `enum`).

```ts
export namespace EXAMPLE_LOG_BINDINGS {
  export const METADATA = 'example.log.metadata';
  export const APP_LOG_LEVEL = 'example.log.level';
  export const TIMER = 'example.log.timer';
  export const LOG_ACTION = 'example.log.action';
}

export enum LOG_LEVEL {
  DEBUG,
  INFO,
  WARN,
  ERROR,
  OFF,
}
```

### `src/types.ts`
Define TypeScript type definitions / interfaces for complex types and functions here.

```ts
import {ParsedRequest, OperationArgs} from '@loopback/rest';

export interface LogFn {
  (
    req: ParsedRequest,
    args: OperationArgs,
    result: any,
    startTime?: HighResTime,
  ): Promise<void>;

  startTimer(): HighResTime;
}

export type LevelMetadata = {level: number};
export type HighResTime = [number, number]; // [seconds, nanoseconds]
export type TimerFn = (start?: HighResTime) => HighResTime;
```

### `src/decorators/log.decorator.ts`
Extension users can use decorators to provide "hints" (or metadata) for our
component. These "hints" allow the extension to modify behaviour accordingly.

For this extension, the decorator marks which controller methods should be
logged (and optionally at which level they should be logged).
`Reflector` from `@loopback/context` is used to store and retrieve the metadata
by the extension.

```ts
import {LOG_LEVEL, EXAMPLE_LOG_BINDINGS} from '../keys';
import {Constructor, Reflector} from '@loopback/context';
import {LevelMetadata} from '../types';

export function log(level?: number) {
  return function(target: Object, methodName: string): void {
    if (level === undefined) level = LOG_LEVEL.WARN;
    Reflector.defineMetadata(
      EXAMPLE_LOG_BINDINGS.METADATA,
      {level},
      target,
      methodName,
    );
  };
}

export function getLogMetadata(
  controllerClass: Constructor<{}>,
  methodName: string,
): LevelMetadata {
  return Reflector.getMetadata(
    EXAMPLE_LOG_BINDINGS.METADATA,
    controllerClass.prototype,
    methodName,
  );
}
```

### `src/mixins/log-level.mixin.ts`
Extension users must set an app wide log level at or above which the decorated
controller methods will be logged. A user can do so by binding the level to
`example.log.level` but this can be a hassle.

A mixin makes it easier for the user to set the application wide log level by
providing it via `ApplicationOptions` or using a helper method `app.logLevel(level: number)`.

```ts
import {Constructor} from '@loopback/context';
import {EXAMPLE_LOG_BINDINGS} from '../keys';

export function LogLevelMixin<T extends Constructor<any>>(superClass: T) {
  return class extends superClass {
    constructor(...args: any[]) {
      super(...args);
      if (!this.options) this.options = {};

      if (this.options.logLevel) {
        this.logLevel(this.options.logLevel);
      }
    }

    logLevel(level: number) {
      this.bind(EXAMPLE_LOG_BINDINGS.APP_LOG_LEVEL).to(level);
    }
  };
}
```

### Providers
A Providers is a class that returns a `value()` function that can be invoked by
LoopBack 4.

### `src/providers/timer.provider.ts`
A timer than can be used to time the function that is being logged.

```ts
import {Provider} from '@loopback/context';
import {TimerFn, HighResTime} from '../types';

export class TimerProvider implements Provider<TimerFn> {
  constructor() {}
  value(): TimerFn {
    return (start?: HighResTime): HighResTime => {
      if (!start) return process.hrtime();
      return process.hrtime(start);
    };
  }
}
```

### `src/providers/log-level.provider.ts`
A provider can set the default binding value for `example.log.level` so it's
easier to get started with the extension. User's can override the value by
binding a new value or using the mixin.

```ts
import {Provider} from '@loopback/context';
import {LOG_LEVEL} from '../keys';

export class LogLevelProvider implements Provider<number> {
  constructor() {}
  value(): number {
    return LOG_LEVEL.WARN;
  }
}
```

### `src/providers/log-action.provider.ts`
This will be the most important provider for the extension as it is responsible
for actually logging the request. The extension will retrieve the metadata
stored by the `@log()` decorator using the controller and method name.
Since bindings are resolved at runtime and these values change with each request,
`inject.getter()` must be used to get a function capable of resolving the value
when called. The action provider will look as follows:

```ts
import {inject, Provider, Constructor, Getter} from '@loopback/context';
import {CoreBindings} from '@loopback/core';
import {OperationArgs, ParsedRequest} from '@loopback/rest';
import {getLogMetadata} from '../decorators/log.decorator';
import {EXAMPLE_LOG_BINDINGS, LOG_LEVEL} from '../keys';
import {LogFn, TimerFn, HighResTime, LevelMetadata} from '../types';
import chalk from 'chalk';

export class LogActionProvider implements Provider<LogFn> {
  constructor(
    @inject.getter(CoreBindings.CONTROLLER_CLASS)
    private readonly getController: Getter<Constructor<{}>>,
    @inject.getter(CoreBindings.CONTROLLER_METHOD_NAME)
    private readonly getMethod: Getter<string>,
    @inject(EXAMPLE_LOG_BINDINGS.APP_LOG_LEVEL)
    private readonly logLevel: number,
    @inject(EXAMPLE_LOG_BINDINGS.TIMER) public timer: TimerFn,
  ) {}

  value(): LogFn {
    const fn = <LogFn>((
      req: ParsedRequest,
      args: OperationArgs,
      result: any,
      start?: HighResTime,
    ) => {
      return this.action(req, args, result, start);
    });

    fn.startTimer = () => {
      return this.timer();
    };

    return fn;
  }

  private async action(
    req: ParsedRequest,
    args: OperationArgs,
    result: any,
    start?: HighResTime,
  ): Promise<void> {
    const controllerClass = await this.getController();
    const methodName: string = await this.getMethod();
    const metadata: LevelMetadata = getLogMetadata(controllerClass, methodName);
    const level: number | undefined = metadata ? metadata.level : undefined;

    if (
      level !== undefined &&
      this.logLevel !== LOG_LEVEL.OFF &&
      level >= this.logLevel &&
      level !== LOG_LEVEL.OFF
    ) {
      if (!args) args = [];
      let log = `${req.url} :: ${controllerClass.name}.`;
      log += `${methodName}(${args.join(', ')}) => `;

      if (typeof result === 'object') log += JSON.stringify(result);
      else log += result;

      if (start) {
        const timeDiff: HighResTime = this.timer(start);
        const time: number =
          timeDiff[0] * 1000 + Math.round(timeDiff[1] * 1e-4) / 100;
        log = `${time}ms: ${log}`;
      }

      switch (level) {
        case LOG_LEVEL.DEBUG:
          console.log(chalk.white(`DEBUG: ${log}`));
          break;
        case LOG_LEVEL.INFO:
          console.log(chalk.green(`INFO: ${log}`));
          break;
        case LOG_LEVEL.WARN:
          console.log(chalk.yellow(`WARN: ${log}`));
          break;
        case LOG_LEVEL.ERROR:
          console.log(chalk.red(`ERROR: ${log}`));
          break;
      }
    }
  }
}
```

### `src/index.ts`
Export all the files to ensure a user can import the necessary components.

```ts
export * from './decorators/log.decorator';
export * from './mixins/log-level.mixin';
export * from './providers/log-action.provider';
export * from './providers/log-level.provider';
export * from './providers/timer.provider';
export * from './component';
export * from './types';
export * from './keys';
```

### `src/component.ts`
Package the providers in the component to their appropriate `Binding` keys so
they are automatically bound when a user adds the component to their application.

```ts
import {EXAMPLE_LOG_BINDINGS} from './keys';
import {Component, ProviderMap} from '@loopback/core';
import {TimerProvider, LogActionProvider, LogLevelProvider} from './';

export class LogComponent implements Component {
  providers?: ProviderMap = {
    [EXAMPLE_LOG_BINDINGS.TIMER]: TimerProvider,
    [EXAMPLE_LOG_BINDINGS.LOG_ACTION]: LogActionProvider,
    [EXAMPLE_LOG_BINDINGS.APP_LOG_LEVEL]: LogLevelProvider,
  };
}
```

## Testing

Tests should be written to ensure the behaviour implemented is correct and
future modifications don't break this expected behavior *(unless it's
intentional in which case the tests should be updated as well)*.

Take a look at the test folder to see the variety of tests written for this
extension. There are unit tests to test functionality of individual functions
as well as an extension acceptance test which tests the entire extension as a
whole (everything working together).

## License

MIT License
