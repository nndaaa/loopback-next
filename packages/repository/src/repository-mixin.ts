// Copyright IBM Corp. 2017. All Rights Reserved.
// Node module: @loopback/repository
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {Class} from './common-types';
import {Repository} from './repository';

// tslint:disable:no-any

/**
 * A mixin class for Application that creates a .repository()
 * function to register a repository automatically. Also overrides
 * component function to allow it to register repositories automatically.
 *
 * ```ts
 *
 * class MyApplication extends RepositoryMixin(Application) {}
 * ```
 */
export function RepositoryMixin<T extends Class<any>>(superClass: T) {
  return class extends superClass {
    // A mixin class has to take in a type any[] argument!
    constructor(...args: any[]) {
      super(...args);
    }

    /**
     * Add a repository or an array of repositories
     * to this application.
     *
     * @param repo The repository to add.
     *
     * ```ts
     *
     * class NoteRepo {
     *   model: any;
     *
     *   constructor() {
     *     const ds: juggler.DataSource = new DataSourceConstructor({
     *       name: 'db',
     *       connector: 'memory',
     *     });
     *
     *     this.model = ds.createModel(
     *       'note',
     *       {title: 'string', content: 'string'},
     *       {}
     *     );
     *   }
     * };
     *
     * app.repository(NoteRepo);
     * ```
     */
    repository(repo: Class<Repository<any>>): void;
    repository(repos: Class<Repository<any>>[]): void;
    repository(repo: Class<Repository<any>> | Class<Repository<any>>[]) {
      if (!Array.isArray(repo)) {
        const repoKey = `repositories.${repo.name}`;
        this.bind(repoKey).toClass(repo);
      } else {
        repo.map(r => this.repository(r));
      }
    }

    /**
     * Add a component or an array of components to this application.
     * Also mounts all the components repositories.
     *
     * @param component The component to add.
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
    public component(component: Class<any>): void;
    public component(components: Class<any>[]): void;
    public component(component: Class<any> | Class<any>[]) {
      if (!Array.isArray(component)) {
        super.component(component);
        this.mountComponentRepository(component);
      } else {
        component.map(comp => this.component(comp));
      }
    }

    /**
     * Get an instance of a component and mount all it's
     * repositories. This function is intended to be used internally
     * by component()
     *
     * @param component The component to mount repositories of
     */
    mountComponentRepository(component: Class<any>) {
      const componentKey = `components.${component.name}`;
      const compInstance = this.getSync(componentKey);

      if (compInstance.repositories) {
        for (const repo of compInstance.repositories) {
          this.repository(repo);
        }
      }
    }
  };
}
