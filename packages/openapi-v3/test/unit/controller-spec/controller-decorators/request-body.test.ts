// Copyright IBM Corp. 2018. All Rights Reserved.
// Node module: @loopback/openapi-v3
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import {
  post,
  requestBody,
  getControllerSpec,
  Integer,
  Float,
} from '../../../..';
import {expect} from '@loopback/testlab';
import {model, property} from '@loopback/repository';
import * as stream from 'stream';

describe('Routing metadata for request body', () => {
  describe('@requestBody', () => {
    context('can build a correct "RequestBody" spec and', () => {
      it('persists "description" and "required" into the generated schema', () => {
        const requestSpec = {
          description: 'A sample request body',
          required: true,
        };
        class MyController {
          @post('/greeting')
          greet(@requestBody(requestSpec) name: string) {}
        }

        const r = getControllerSpec(MyController).paths['/greeting']['post']
          .requestBody;
        expect(r.description).to.eql('A sample request body');
        expect(r.required).to.eql(true);
      });
      it('defaults content-type to "application/json"', () => {
        const requestSpec = {
          description: 'A sample request body',
          required: true,
        };
        class MyController {
          @post('/greeting')
          greet(@requestBody(requestSpec) name: string) {}
        }

        const r = getControllerSpec(MyController).paths['/greeting']['post']
          .requestBody;
        expect(r.content).to.have.key('application/json');
      });
      it('infers request body with primative types', () => {
        class MyController {
          @post('/greetingWithString')
          greetWithString(@requestBody() name: string) {}
          @post('/greetingWithNumber')
          greetWithNumber(@requestBody() name: number) {}
          @post('/greetingWithBoolean')
          greetWithBoolean(@requestBody() name: boolean) {}
          @post('/greetingWithArray')
          greetWithArray(@requestBody() name: string[]) {}
          @post('/greetingWithFile')
          greetWithFile(@requestBody() name: stream.Readable) {}
          @post('/greetingWithObject')
          greetWitObejct(@requestBody() name: object) {}
          @post('/greetingWithInteger')
          greetWithInteger(@requestBody() name: Integer) {}
          // more primitive type test cases to be added
        }

        const actualSpec = getControllerSpec(MyController);
        const expectedContentWithString = {
          'application/json': {
            schema: {
              type: 'string',
            },
          },
        };
        const expectedContentWithNumber = {
          'application/json': {
            schema: {
              type: 'number',
            },
          },
        };
        const expectedContentWithBoolean = {
          'application/json': {
            schema: {
              type: 'boolean',
            },
          },
        };
        const expectedContentWithArray = {
          'application/json': {
            schema: {
              type: 'array',
            },
          },
        };
        const expectedContentWithObject = {
          'application/json': {
            schema: {
              type: 'object',
            },
          },
        };
        const expectedContentWithInteger = {
          'application/json': {
            schema: {
              type: 'integer',
              format: 'int32',
            },
          },
        };

        expect(
          actualSpec.paths['/greetingWithString']['post'].requestBody.content,
        ).to.eql(expectedContentWithString);
        expect(
          actualSpec.paths['/greetingWithNumber']['post'].requestBody.content,
        ).to.eql(expectedContentWithNumber);
        expect(
          actualSpec.paths['/greetingWithBoolean']['post'].requestBody.content,
        ).to.eql(expectedContentWithBoolean);
        expect(
          actualSpec.paths['/greetingWithArray']['post'].requestBody.content,
        ).to.eql(expectedContentWithArray);
        expect(
          actualSpec.paths['/greetingWithObject']['post'].requestBody.content,
        ).to.eql(expectedContentWithObject);
        expect(
          actualSpec.paths['/greetingWithInteger']['post'].requestBody.content,
        ).to.eql(expectedContentWithInteger);

        // For review
        let a: Float = 2;
        expect(typeof a).to.equal('number');
      });
      it('infers request body with complex type', () => {
        const expectedContent = {
          'application/text': {
            schema: {$ref: '#/components/schemas/MyModel'},
          },
        };
        @model()
        class MyModel {
          @property() name: string;
          // @property() foo: Foo;
        }

        // @model()
        // class Foo {
        //   @property() bar: string;
        // }

        class MyController {
          @post('/MyModel')
          createMyModel(
            @requestBody({content: {'application/text': {}}})
            inst: MyModel,
          ) {}
        }

        const r = getControllerSpec(MyController).paths['/MyModel']['post']
          .requestBody;
        expect(r.content).to.deepEqual(expectedContent);
      });
      it('infers a complex parameter schema with in:body', () => {
        // TBD after addressing comment
      });
      it('does not produce nested definitions', () => {
        // TBD after addressing comment
      });
      it('does not infer definition if no class metadata is present', () => {
        // TBD after addressing comment
      });
      it('does not detect type when requestBodySpec contains "type"', () => {
        // TBD
      });
      it('schema in requestBody overrides the generated schema', () => {
        const expectedContent = {
          'application/json': {
            schema: {type: 'object'},
          },
        };

        class MyModel {}

        class MyController {
          @post('/MyModel')
          createMyModel(
            @requestBody({content: expectedContent})
            inst: MyModel,
          ) {}
        }

        const r = getControllerSpec(MyController).paths['/MyModel']['post']
          .requestBody;
        expect(r.content).to.deepEqual(expectedContent);
      });
      it('reports error if more than one requestBody are found for the same method', () => {
        class MyController {
          @post('/greeting')
          greet(@requestBody() name: string, @requestBody() foo: number) {}
        }
        expect(() => getControllerSpec(MyController)).to.throwError(
          /An operation should only have one parameter decorated by @requestBody/,
        );
      });
    });
  });
});
