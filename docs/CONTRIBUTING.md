# Contributing to LoopBack

Contributions to Node.js include code, documentation, answering user questions, and advocating for all types of Node.js users. See our official documentation on loopback.io for more information common to all of our GitHub repositories:

  - http://loopback.io/doc/en/contrib/index.html

The rest of this document described technical details specific to loopack-next monorepo.

## Setting up development environment

We recommend our contributors to use VisualStudio Code with the following extensions installed:

 - [Prettier - Code Formatter](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) for automatic formatting of source files on save.

 - [TSLint](https://marketplace.visualstudio.com/items?itemName=eg2.tslint) to highlight and auto-fix linting problems directly in the editor.

Having said that, our project provides `package.json` scripts that are independent of any IDE, you are welcome to use your favorite IDE or editor instead of VS Code.

## Common tasks

### Build-test-lint cycle

(to be described)

### Run CI build locally

(to be described)

### Update project after switching git branches

(to be described)

## Improving project infrastructure

Whenever making changes to our configuration of TypeScript compiler, TSLint or Prettier, extra care must be taken to avoid regressions, especially in the integration with VisualStudio Code.

### Verify TypeScript setup

#### Compilation errors

1. Open any existing TypeScript file, e.g. `packages/src/index.ts`

2. Add a small bit of code to break TypeScript's type checks, for example:

    ```ts
    const foo: number = 'bar';
    ```

3. Verify that VS Code editor has marked `foo` with a red underscore. Hover over `foo` and check the problem message. It should mention `[ts]` source, e.g.

    ```text
    [ts] Type '"bar"' is not assignable to type 'number'.

    ```

4. Check VS Code's [PROBLEMS Window](https://code.visualstudio.com/docs/getstarted/tips-and-tricks#_errors-and-warnings).  There should be an entry showing the same tslint error. When you click on the entry, it should jump on the problematic line.

5. Close the editor tab. (This will clear the PROBLEMS entry reported by TSLint extension).

6. Run the test task ("Tasks: Run test task"). This will invoke package scripts like `npm test` under the hood.

7. Open "Tasks" OUTPUT window and verify that compilation error was parsed by VSCode.

8. Verify that compilation errors are correctly associated with the problematic source code line.
   _(2018-02-82: this is does not work now, `tsc` is reporting paths relative to individual package directories.)_

#### Navigation in VS Code

Verify that "Go to definition" works across package boundaries.  Find a place where we are calling `@inject` in `authentication` package, press F12 to go to the definition of `inject`. VSCode should jump to the `.ts` file in `src` (as opposed to jumping to a `.d.ts` file in `dist`)

#### Refactoring in VS Code

Verify that refactorings like "rename" will change all places using the renamed entity. Two different scenarios to verify: rename at the place where the entity is defined, rename at the place where the entity is used. (You can e.g. rename `inject` to test.)

### Verify TSLint setup

1. Open any existing TypeScript file, e.g. `packages/src/index.ts`

2. Verify that TSLint extension is not reporting any warnings in the output
   window:
    - pres _Cmd+shift+P_ or _Ctrl+shift+P_ to open task selector
    - find and run the task `TSLint: Show Output`
    - check the logs

    An example of a warning we want to **avoid**:

    ```text
    Warning: The 'no-unused-variable' rule requires type information.
    ```

3. Introduce two kinds linting problems - one that does and another that does not require type information to be detected. For example, you can add the following line at the end of the opened `index.ts`:

    ```ts
    const foo: any = 'bar';
    ```

4. Verify that VS Code editor has marked `any` with a red underscore. Hover over `any` and check the problem message. It should mention `no-any` rule, e.g.

    ```text
    [tslint] Type declaration of 'any' loses type-safety. Consider replacing it with a more precise type. (no-any)
    ```

5. Check VS Code's [PROBLEMS Window](https://code.visualstudio.com/docs/getstarted/tips-and-tricks#_errors-and-warnings).  There should be an entry showing the same tslint error. When you click on the entry, it should jump on the problematic line.

6. Close the editor tab. (This will clear the PROBLEMS entry reported by TSLint extension).

7. Run the test task ("Tasks: Run test task"). This will invoke package scripts like `npm test` under the hood.

8. Open "Tasks" OUTPUT window and verify that two tslint problems were reported:

    ```text
    ERROR: /Users/(...)/packages/core/src/index.ts[16, 7]: 'foo' is declared but its value is never read.
    ERROR: /Users/(...)/packages/core/src/index.ts[16, 12]: Type declaration of 'any' loses type-safety. Consider replacing it with a more precise type.
    ```

9. Open "PROBLEMS" window again. Verify that both problems were parsed by VS Code and are correctly associated with the problematic source code line.

