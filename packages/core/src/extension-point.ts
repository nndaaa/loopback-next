// Copyright IBM Corp. 2017. All Rights Reserved.
// Node module: @loopback/core
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {Context, Binding} from '@loopback/context';

// tslint:disable:no-any
/**
 * Interface for the extension point configuration
 */
export interface ExtensionPointConfig {
  // Configuration properties for extensions keyed by the extension name
  extensions: {
    [extensionName: string]: any;
  };
  // Configuration properties for the extension point itself
  [property: string]: any;
}

/**
 * Base class for extension points
 */
export abstract class ExtensionPoint<EXT extends object> {
  /**
   * Configuration (typically to be injected)
   */
  public readonly config: ExtensionPointConfig;

  constructor(
    /**
     * The unique name of this extension point. It also serves as the binding
     * key prefix for bound extensions
     */
    public readonly name: string,
    /**
     * The Context (typically to be injected)
     */
    protected readonly context: Context,
    /**
     * Configuration (typically to be injected)
     */
    config?: ExtensionPointConfig,
  ) {
    this.config = config || {extensionPoint: {}, extensions: {}};
  }

  /**
   * Find an array of bindings for extensions
   */
  getAllExtensionBindings(): Binding[] {
    return this.context.findByTag(`extensionPoint:${this.name}`);
  }

  /**
   * Get a map of extension bindings by the keys
   */
  getExtensionBindingMap(): {[name: string]: Binding} {
    const extensions: {[name: string]: Binding} = {};
    const bindings = this.getAllExtensionBindings();
    bindings.forEach(binding => {
      extensions[binding.key] = binding;
    });
    return extensions;
  }

  /**
   * Look up an extension binding by name
   * @param extensionName Name of the extension
   */
  getExtensionBinding(extensionName: string): Binding {
    const bindings = this.getAllExtensionBindings();
    const binding = bindings.find(b => b.tags.has(`name:${extensionName}`));
    if (binding == null)
      throw new Error(
        `Extension ${extensionName} does not exist for extension point ${this
          .name}`,
      );
    return binding;
  }

  /**
   * Get configuration for this extension point
   */
  async getConfiguration() {
    const key = `${this.name}.config`;
    if (!this.context.isBound(key)) {
      return {};
    }
    return await this.context.get(key);
  }

  /**
   * Get configuration for an extension of this extension point
   * @param extensionName Name of the extension
   */
  async getExtensionConfiguration(extensionName: string) {
    const key = `${this.name}.${extensionName}.config`;
    if (!this.context.isBound(key)) {
      return {};
    }
    return await this.context.get(key);
  }

  /**
   * Get an instance of an extension by name
   * @param extensionName Name of the extension
   */
  async getExtension(extensionName: string): Promise<EXT> {
    const binding = this.getExtensionBinding(extensionName);
    // Create a child context to bind `config`
    const extensionContext = new Context(this.context);
    const config = await this.getExtensionConfiguration(extensionName);
    extensionContext.bind('config').to(config);
    return binding.getValue(extensionContext);
  }
}
