// Copyright IBM Corp. 2017,2018. All Rights Reserved.
// Node module: @loopback/core
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {Context, Binding, BindingScope, Constructor} from '@loopback/context';
import {Server} from './server';
import {Component, mountComponent} from './component';
import {CoreBindings} from './keys';

/**
 * Application is the container for various types of artifacts, such as
 * components, servers, controllers, repositories, datasources, connectors,
 * and models.
 */
export class Application extends Context {
  constructor(public options?: ApplicationConfig) {
    super();
    if (!options) options = {};

    // Bind to self to allow injection of application context in other
    // modules.
    this.bind(CoreBindings.APPLICATION_INSTANCE).to(this);
    // Make options available to other modules as well.
    this.bind(CoreBindings.APPLICATION_CONFIG).to(options);
  }

  /**
   * Register a controller class or an array of controller classes
   * with this application.
   *
   * @param controllerCtor {Function} The controller class
   * (constructor function) or an array of.
   * @param {string=} name Optional controller name, default to the class name
   * @return {Binding} The newly created binding, you can use the reference to
   * further modify the binding, e.g. lock the value to prevent further
   * modifications.
   *
   * ```ts
   * class MyController {
   * }
   * app.controller(MyController).lock();
   * ```
   */
  controller(controllerCtor: ControllerClass, name?: string): Binding;
  controller(ctors: ControllerClass[]): Binding[];
  controller(
    ctor: ControllerClass | ControllerClass[],
    name?: string,
  ): Binding | Binding[] {
    if (!Array.isArray(ctor)) {
      name = name || ctor.name;
      return this.bind(`controllers.${name}`)
        .toClass(ctor)
        .tag('controller');
    } else {
      return ctor.map(ctrl => this.controller(ctrl));
    }
  }

  /**
   * Bind a Server constructor or an array of Server constructors
   * to the Application's master context.
   * Each server constructor added in this way must provide a unique prefix
   * to prevent binding overlap.
   *
   * ```ts
   * app.server(RestServer);
   * // This server constructor will be bound under "servers.RestServer".
   * app.server(RestServer, "v1API");
   * // This server instance will be bound under "servers.v1API".
   * ```
   *
   * @param {Constructor<Server>} server The server constructor.
   * @param {string=} name Optional override for key name.
   * @returns {Binding} Binding for the server class
   * @memberof Application
   */
  public server<T extends Server>(ctor: Constructor<T>, name?: string): Binding;
  public server<T extends Server>(ctors: Constructor<T>[]): Binding[];
  public server<T extends Server>(
    ctor: Constructor<T> | Constructor<T>[],
    name?: string,
  ): Binding | Binding[] {
    if (!Array.isArray(ctor)) {
      const suffix = name || ctor.name;
      const key = `${CoreBindings.SERVERS}.${suffix}`;
      return this.bind(key)
        .toClass(ctor)
        .tag('server')
        .inScope(BindingScope.SINGLETON);
    } else {
      return ctor.map(server => this.server(server));
    }
  }

  /**
   * Retrieve the singleton instance for a bound constructor.
   *
   * @template T
   * @param {Constructor<T>=} ctor The constructor that was used to make the
   * binding.
   * @returns {Promise<T>}
   * @memberof Application
   */
  public async getServer<T extends Server>(
    target: Constructor<T> | String,
  ): Promise<T> {
    let key: string;
    // instanceof check not reliable for string.
    if (typeof target === 'string') {
      key = `${CoreBindings.SERVERS}.${target}`;
    } else {
      const ctor = target as Constructor<T>;
      key = `servers.${ctor.name}`;
    }
    return (await this.get(key)) as T;
  }

  /**
   * Start the application, and all of its registered servers.
   *
   * @returns {Promise}
   * @memberof Application
   */
  public async start(): Promise<void> {
    await this._forEachServer(s => s.start());
  }

  /**
   * Stop the application instance and all of its registered servers.
   * @returns {Promise}
   * @memberof Application
   */
  public async stop(): Promise<void> {
    await this._forEachServer(s => s.stop());
  }

  /**
   * Helper function for iterating across all registered server components.
   * @protected
   * @template T
   * @param {(s: Server) => Promise<T>} fn The function to run against all
   * registered servers
   * @memberof Application
   */
  protected async _forEachServer<T>(fn: (s: Server) => Promise<T>) {
    const bindings = this.find(`${CoreBindings.SERVERS}.*`);
    await Promise.all(
      bindings.map(async binding => {
        const server = (await this.get(binding.key)) as Server;
        return await fn(server);
      }),
    );
  }

  /**
   * Add a component or an array of components to this application
   * and register extensions such as controllers, providers,
   * and servers from the component.
   *
   * @param componentCtor The component class or an array of to add.
   * @param {string=} name Optional component name, default to the class name
   *
   * ```ts
   *
   * export class ProductComponent {
   *   controllers = [ProductController];
   *   repositories = [ProductRepo, UserRepo];
   *   providers = {
   *     [AUTHENTICATION_STRATEGY]: AuthStrategy,
   *     [AUTHORIZATION_ROLE]: Role,
   *   };
   * };
   *
   * app.component(ProductComponent);
   * ```
   */
  public component(componentCtor: Constructor<Component>, name?: string): void;
  public component(ctors: Constructor<Component>[]): void;
  public component(
    ctor: Constructor<Component> | Constructor<Component>[],
    name?: string,
  ) {
    if (!Array.isArray(ctor)) {
      name = name || ctor.name;
      const componentKey = `components.${name}`;
      this.bind(componentKey)
        .toClass(ctor)
        .inScope(BindingScope.SINGLETON)
        .tag('component');
      // Assuming components can be synchronously instantiated
      const instance = this.getSync(componentKey);
      mountComponent(this, instance);
    } else {
      ctor.map(component => this.component(component));
    }
  }
}

/**
 * Configuration for application
 */
export interface ApplicationConfig {
  /**
   * Other properties
   */
  // tslint:disable-next-line:no-any
  [prop: string]: any;
}

// tslint:disable-next-line:no-any
export type ControllerClass = Constructor<any>;
