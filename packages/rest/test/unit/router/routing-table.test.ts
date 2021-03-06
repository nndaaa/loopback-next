// Copyright IBM Corp. 2017,2018. All Rights Reserved.
// Node module: @loopback/rest
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {
  ParsedRequest,
  parseRequestUrl,
  RoutingTable,
  ControllerRoute,
} from '../../..';
import {getControllerSpec, param, get} from '@loopback/openapi-v2';
import {expect, ShotRequestOptions, ShotRequest} from '@loopback/testlab';
import {anOpenApiSpec} from '@loopback/openapi-spec-builder';

describe('RoutingTable', () => {
  it('joins basePath and path', () => {
    expect(RoutingTable.joinPath('', 'a')).to.equal('/a');
    expect(RoutingTable.joinPath('/', '')).to.equal('/');
    expect(RoutingTable.joinPath('/', 'a')).to.equal('/a');
    expect(RoutingTable.joinPath('/root', 'a')).to.equal('/root/a');
    expect(RoutingTable.joinPath('root', 'a')).to.equal('/root/a');
    expect(RoutingTable.joinPath('root/', '/a')).to.equal('/root/a');
    expect(RoutingTable.joinPath('root/', '/a/')).to.equal('/root/a');
    expect(RoutingTable.joinPath('/root/', '/a/')).to.equal('/root/a');
    expect(RoutingTable.joinPath('/root//x', '/a')).to.equal('/root/x/a');
    expect(RoutingTable.joinPath('/root/', '/')).to.equal('/root');
    expect(RoutingTable.joinPath('/root/x', '/a/b')).to.equal('/root/x/a/b');
    expect(RoutingTable.joinPath('//root//x', '//a///b////c')).to.equal(
      '/root/x/a/b/c',
    );
  });

  it('does not fail if some of the parameters are not decorated', () => {
    class TestController {
      @get('/greet')
      greet(prefix: string, @param.query.string('message') message: string) {
        return prefix + ': ' + message;
      }
    }
    const spec = getControllerSpec(TestController);
    const table = new RoutingTable();
    table.registerController(TestController, spec);
    const paths = table.describeApiPaths();
    const params = paths['/greet']['get'].parameters;
    expect(params).to.have.property('length', 1);
    expect(params[0]).to.have.properties({
      name: 'message',
      in: 'query',
      type: 'string',
    });
  });

  it('finds simple "GET /hello" endpoint', () => {
    const spec = anOpenApiSpec()
      .withOperationReturningString('get', '/hello', 'greet')
      .build();

    class TestController {}

    const table = new RoutingTable();
    table.registerController(TestController, spec);

    const request = givenRequest({
      method: 'get',
      url: '/hello',
    });

    const route = table.find(request);

    expect(route).to.be.instanceOf(ControllerRoute);
    expect(route)
      .to.have.property('spec')
      .containEql(spec.paths['/hello'].get);
    expect(route).to.have.property('pathParams');
    expect(route.describe()).to.equal('TestController.greet');
  });

  it('finds simple "GET /my/hello" endpoint', () => {
    const spec = anOpenApiSpec()
      .withOperationReturningString('get', '/hello', 'greet')
      .build();

    spec.basePath = '/my';

    class TestController {}

    const table = new RoutingTable();
    table.registerController(TestController, spec);

    const request = givenRequest({
      method: 'get',
      url: '/my/hello',
    });

    const route = table.find(request);

    expect(route).to.be.instanceOf(ControllerRoute);
    expect(route)
      .to.have.property('spec')
      .containEql(spec.paths['/hello'].get);
    expect(route).to.have.property('pathParams');
    expect(route.describe()).to.equal('TestController.greet');
  });

  function givenRequest(options?: ShotRequestOptions): ParsedRequest {
    return parseRequestUrl(new ShotRequest(options || {url: '/'}));
  }
});
