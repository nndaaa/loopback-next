// // Copyright IBM Corp. 2018. All Rights Reserved.
// // Node module: @loopback/openapi-v3
// // This file is licensed under the MIT License.
// // License text available at https://opensource.org/licenses/MIT

// import {post, param, getControllerSpec} from '../../../../..';
// import {expect} from '@loopback/testlab';

// describe('Routing metadata for parameters', () => {
//   describe('@param.cookie.string', () => {
//     it('defines a parameter with in:formData type:string', () => {
//       class MyController {
//         @post('/greeting')
//         @param.cookie.string('name')
//         greet(name: string) {}
//       }

//       const actualSpec = getControllerSpec(MyController);

//       expect(actualSpec.paths['/greeting']['post'].parameters).to.eql([
//         {
//           name: 'name',
//           type: 'string',
//           in: 'cookie',
//         },
//       ]);
//     });
//   });

//   describe('@param.cookie.number', () => {
//     it('defines a parameter with in:formData type:number', () => {
//       class MyController {
//         @post('/greeting')
//         @param.cookie.number('name')
//         greet(name: string) {}
//       }

//       const actualSpec = getControllerSpec(MyController);

//       expect(actualSpec.paths['/greeting']['post'].parameters).to.eql([
//         {
//           name: 'name',
//           type: 'number',
//           in: 'cookie',
//         },
//       ]);
//     });
//   });

//   describe('@param.cookie.integer', () => {
//     it('defines a parameter with in:formData type:integer', () => {
//       class MyController {
//         @post('/greeting')
//         @param.cookie.integer('name')
//         greet(name: string) {}
//       }

//       const actualSpec = getControllerSpec(MyController);

//       expect(actualSpec.paths['/greeting']['post'].parameters).to.eql([
//         {
//           name: 'name',
//           type: 'integer',
//           in: 'cookie',
//         },
//       ]);
//     });
//   });

//   describe('@param.cookie.boolean', () => {
//     it('defines a parameter with in:formData type:boolean', () => {
//       class MyController {
//         @post('/greeting')
//         @param.cookie.boolean('name')
//         greet(name: string) {}
//       }

//       const actualSpec = getControllerSpec(MyController);

//       expect(actualSpec.paths['/greeting']['post'].parameters).to.eql([
//         {
//           name: 'name',
//           type: 'boolean',
//           in: 'cookie',
//         },
//       ]);
//     });
//   });
// });

// class Integer extends Number {}
// class Float extends Number {}
// function log(n: Number): Integer {
//   return n;
// }

// function next(n: Float) {}

// next(log(1));
