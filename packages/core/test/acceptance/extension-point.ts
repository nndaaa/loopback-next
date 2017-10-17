// Copyright IBM Corp. 2013,2017. All Rights Reserved.
// Node module: loopback
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {expect} from '@loopback/testlab';
import {Context, BindingScope, inject, Constructor} from '@loopback/context';
import {Application, ExtensionPoint, ExtensionPointConfig} from '../..';

// tslint:disable:no-any
interface AuthenticationStrategy {
  authenticate(credentials: any): Promise<boolean>;
  config: any;
}

class LocalStrategy implements AuthenticationStrategy {
  constructor(@inject('config') public config: any) {}

  authenticate(credentials: any) {
    return Promise.resolve(true);
  }
}

class LDAPStrategy implements AuthenticationStrategy {
  constructor(@inject('config') public config: any) {}

  authenticate(credentials: any) {
    return Promise.resolve(true);
  }
}

class OAuth2Strategy implements AuthenticationStrategy {
  constructor(@inject('config') public config: any) {}

  authenticate(credentials: any) {
    return Promise.resolve(true);
  }
}

const AUTH_EXTENSION_POINT = 'authentication.strategies';

class AuthenticationManager extends ExtensionPoint<AuthenticationStrategy> {
  constructor(
    @inject('$context') context: Context,
    @inject('config') config: ExtensionPointConfig,
  ) {
    super(AUTH_EXTENSION_POINT, context, config);
  }

  async authenticate(strategy: string, credentials: any): Promise<boolean> {
    const ext: AuthenticationStrategy = await this.getExtension(strategy);
    return ext.authenticate(credentials);
  }
}

const configs: {[name: string]: object} = {
  local: {
    url: 'https://localhost:3000/users/login',
  },
  ldap: {
    url: 'ldap://localhost:1389',
  },
  oauth2: {
    clientId: 'my-client-id',
    clientSecret: 'my-client-secret',
    tokenInspectUrl: 'https://localhost:3000/oauth2/inspect',
  },
};

// Register multiple extensions
const extensions: {[name: string]: Constructor<any>} = {
  local: LocalStrategy,
  ldap: LDAPStrategy,
  oauth2: OAuth2Strategy,
};

describe('Extension point', () => {
  let ctx: Context;
  beforeEach('given a context', createContext);

  it('lists all extensions', async () => {
    const authManager = await ctx.get(AUTH_EXTENSION_POINT);
    const extBindings = authManager.getAllExtensionBindings();
    expect(extBindings.length).to.eql(3);
  });

  it('gets an extension by name', async () => {
    const authManager: AuthenticationManager = await ctx.get(
      AUTH_EXTENSION_POINT,
    );
    const binding = authManager.getExtensionBinding('ldap');
    expect(binding.key).to.eql(`${AUTH_EXTENSION_POINT}.ldap`);
    expect(binding.valueConstructor).to.exactly(LDAPStrategy);
  });

  it('gets an extension instance by name', async () => {
    const authManager: AuthenticationManager = await ctx.get(
      AUTH_EXTENSION_POINT,
    );
    const ext = await authManager.getExtension('ldap');
    expect(ext.config).to.eql({
      url: 'ldap://localhost:1389',
    });
    const result = await ext.authenticate({});
    expect(result).to.be.true();
  });

  it('delegates to an extension', async () => {
    const authManager: AuthenticationManager = await ctx.get(
      AUTH_EXTENSION_POINT,
    );
    const result = await authManager.authenticate('local', {
      username: 'my-user',
      password: 'my-pass',
    });
    expect(result).to.be.true();
  });

  function createContext() {
    ctx = new Context();

    ctx.bind('$context').to(ctx);
    // Register the extension point
    ctx
      .bind(AUTH_EXTENSION_POINT)
      .toClass(AuthenticationManager)
      .inScope(BindingScope.SINGLETON)
      .tag('extensionPoint')
      .tag(`name:${AUTH_EXTENSION_POINT}`);

    ctx.bind(`config`).to({});

    for (const e in extensions) {
      ctx
        .bind(`authentication.strategies.${e}`)
        .toClass(extensions[e])
        .inScope(BindingScope.SINGLETON)
        .tag(`extensionPoint:${AUTH_EXTENSION_POINT}`)
        .tag(`name:${e}`);
      ctx.bind(`authentication.strategies.${e}.config`).to(configs[e]);
    }
  }
});

describe('Application support for extension points', () => {
  let app: Application;

  beforeEach(givenApplication);

  it('registers an extension point by class name', () => {
    app.extensionPoint(AuthenticationManager);
    const binding = app.getBinding('extensionPoints.AuthenticationManager');
    expect(binding.valueConstructor).to.be.exactly(AuthenticationManager);
    expect(binding.scope === BindingScope.SINGLETON);
    expect(
      binding.tags.has('name:extensionPoints.AuthenticationManager'),
    ).to.be.true();
    expect(binding.tags.has('extensionPoint')).to.be.true();
  });

  it('registers an extension point by name', () => {
    app.extensionPoint(AuthenticationManager, AUTH_EXTENSION_POINT);
    const binding = app.getBinding(AUTH_EXTENSION_POINT);
    expect(binding.valueConstructor).to.be.exactly(AuthenticationManager);
    expect(binding.scope === BindingScope.SINGLETON);
    expect(binding.tags.has(`name:${AUTH_EXTENSION_POINT}`)).to.be.true();
    expect(binding.tags.has('extensionPoint')).to.be.true();
  });

  it('registers an extension by class name', () => {
    app.extensionPoint(AuthenticationManager, AUTH_EXTENSION_POINT);
    app.extension(AUTH_EXTENSION_POINT, LocalStrategy);
    const binding = app.getBinding(`${AUTH_EXTENSION_POINT}.LocalStrategy`);
    expect(binding.valueConstructor).to.be.exactly(LocalStrategy);
    expect(binding.tags.has('name:LocalStrategy')).to.be.true();
    expect(
      binding.tags.has(`extensionPoint:${AUTH_EXTENSION_POINT}`),
    ).to.be.true();
  });

  it('registers an extension by class name', () => {
    app.extensionPoint(AuthenticationManager, AUTH_EXTENSION_POINT);
    app.extension(AUTH_EXTENSION_POINT, LocalStrategy);
    const binding = app.getBinding(`${AUTH_EXTENSION_POINT}.LocalStrategy`);
    expect(binding.valueConstructor).to.be.exactly(LocalStrategy);
    expect(binding.tags.has('name:LocalStrategy')).to.be.true();
    expect(
      binding.tags.has(`extensionPoint:${AUTH_EXTENSION_POINT}`),
    ).to.be.true();
  });

  it('registers an extension by name', () => {
    app.extensionPoint(AuthenticationManager, AUTH_EXTENSION_POINT);
    app.extension(AUTH_EXTENSION_POINT, LocalStrategy, 'local');
    const binding = app.getBinding(`${AUTH_EXTENSION_POINT}.local`);
    expect(binding.valueConstructor).to.be.exactly(LocalStrategy);
    expect(binding.tags.has('name:local')).to.be.true();
    expect(
      binding.tags.has(`extensionPoint:${AUTH_EXTENSION_POINT}`),
    ).to.be.true();
  });

  it('reports an error if the extension point is not bound', () => {
    expect(() => app.extension(AUTH_EXTENSION_POINT, LocalStrategy)).to.throw(
      /Extension point authentication\.strategies does not exist/,
    );
  });

  it('configures an extension point', async () => {
    app.bind('$context').to(app);
    const config = {auth: true};
    app.extensionPointConfig(AUTH_EXTENSION_POINT, config);
    app.extensionPoint(AuthenticationManager, AUTH_EXTENSION_POINT);
    const auth = await app.getExtensionPoint(AUTH_EXTENSION_POINT);
    expect(auth.config).to.eql(config);
  });

  it('binds an extension point as singleton', async () => {
    app.bind('$context').to(app);
    const config = {auth: true};
    app.extensionPointConfig(AUTH_EXTENSION_POINT, config);
    app.extensionPoint(AuthenticationManager, AUTH_EXTENSION_POINT);
    const auth1 = await app.getExtensionPoint(AUTH_EXTENSION_POINT);
    const auth2 = await app.getExtensionPoint(AUTH_EXTENSION_POINT);
    expect(auth1).to.be.exactly(auth2);
  });

  it('configures extensions', async () => {
    app.bind('$context').to(app);
    app.bind(`${AUTH_EXTENSION_POINT}.config`).to({});
    app.extensionPoint(AuthenticationManager, AUTH_EXTENSION_POINT);
    app.extension(AUTH_EXTENSION_POINT, LocalStrategy, 'local');
    app.extensionConfig(AUTH_EXTENSION_POINT, 'local', configs.local);
    const extensionPoint: ExtensionPoint<
      AuthenticationStrategy
    > = await app.getExtensionPoint(AUTH_EXTENSION_POINT);
    const extension: LocalStrategy = await extensionPoint.getExtension('local');
    expect(extension.config).to.eql(configs.local);
  });

  function givenApplication() {
    app = new Application();
  }
});
