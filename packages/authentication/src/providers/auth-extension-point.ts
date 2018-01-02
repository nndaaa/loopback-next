// Copyright IBM Corp. 2018. All Rights Reserved.
// Node module: @loopback/authentication
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {ExtensionPoint, CoreBindings} from '@loopback/core';
import {ParsedRequest} from '@loopback/rest';
import {
  UserProfile,
  AuthenticationMetadata,
  Authenticator,
} from '../authentication';
import {Context, inject} from '@loopback/context';
import {AuthenticationBindings} from '../keys';

export class AuthenticationExtensionPoint extends ExtensionPoint<
  Authenticator
> {
  constructor(@inject(CoreBindings.APPLICATION_INSTANCE) ctx: Context) {
    super('authenticators', ctx);
  }

  async authenticate(request: ParsedRequest): Promise<UserProfile | undefined> {
    const meta: AuthenticationMetadata | undefined = await this.context.get(
      AuthenticationBindings.METADATA,
    );
    if (meta == undefined) {
      return undefined;
    }
    const authenticators = await this.getAllExtensions();
    let user: UserProfile | undefined = undefined;
    for (const authenticator of authenticators) {
      if (authenticator.isSupported(meta.strategy)) {
        user = await authenticator.authenticate(request, meta);
        if (user === undefined) continue;
      }
    }
    return user;
  }
}
