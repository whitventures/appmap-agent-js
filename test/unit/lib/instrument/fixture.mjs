// import {strict as Assert} from "assert";
import { parse as acorn } from 'acorn';
import { generate as escodegen } from 'escodegen';

export const generate = (node) => escodegen(node);

const options = {
  ecmaVersion: 2020,
  sourceType: 'script',
};

export const parseProgram = (code) => acorn(`${code}`, options);
export const parseStatement = (code) => acorn(`${code}`, options).body[0];
export const parseExpression = (code) =>
  acorn(`(${code});`, options).body[0].expression;
export const parseSpreadableExpression = (code) =>
  acorn(`[${code}];`, options).body[0].expression.elements[0];
export const parsePattern = (code) =>
  acorn(`[...${code}] = 123;`, options).body[0].expression.left.elements[0]
    .argument;
export const parseRestablePattern = (code) =>
  acorn(`[${code}] = 123;`, options).body[0].expression.left.elements[0];

export const mockResult = (node, entities) => ({ node, entities });

// export const compareResult = (result1, result2) => {
//   Assert.equal(generate(result1.node), generate(result2.node));
//   Assert.deepEqual(result1.entities, result2.entities);
// };

export class MockLocation {
  constructor(namespace, data) {
    this.namespace = namespace;
    this.data = data;
  }
  shouldBeInstrumented() {
    return true;
  }
  getFile() {
    throw new Error(`getFile on MockLocation`);
  }
  getNamespace() {
    return this.namespace;
  }
  makeEntity(childeren) {
    if (this.data === null) {
      throw new Error(`getFile on root MockLocation`);
    }
    return {
      kind: this.data.kind,
      code: escodegen(this.data.node),
      childeren,
    };
  }
  extend(kind, node) {
    return new MockLocation(this.namespace, { kind, node });
  }
}

export const mockRootLocation = (namespace) =>
  new MockLocation(namespace, null);
