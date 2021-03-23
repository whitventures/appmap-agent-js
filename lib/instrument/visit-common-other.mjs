import { combineResult } from './result.mjs';
import { assignVisitorObject, visitExpression } from './visit.mjs';

{
  const makeLiteral = (node, location) => {
    if (
      typeof node.value === 'string' &&
      Reflect.getOwnPropertyDescriptor(node, 'regex') === undefined &&
      Reflect.getOwnPropertyDescriptor(node, 'bigint') === undefined
    ) {
      return {
        type: 'Literal',
        value: node.value,
      };
    }
    throw new Error(`Invalid string literal`);
  };
  const visitor = (node, location) =>
    combineResult(makeLiteral, node, location);
  assignVisitorObject('StringLiteral', { Literal: visitor });
  assignVisitorObject('NonComputedKey', { Literal: visitor });
}

{
  const makeSpreadElement = (node, location, child) => ({
    type: 'SpreadElement',
    argument: child,
  });
  const visitor = (node, location) =>
    combineResult(
      makeSpreadElement,
      node,
      location,
      visitExpression(node.argument, location),
    );
  assignVisitorObject('SpreadableExpression', { SpreadElement: visitor });
  assignVisitorObject('Property', { SpreadElement: visitor });
}

{
  const makeIdentifier = (node, location) => ({
    type: 'Identifier',
    name: node.name,
  });
  {
    const visitor = (node, location) =>
      combineResult(makeIdentifier, node, location);
    assignVisitorObject('NonScopingIdentifier', { Identifier: visitor });
    assignVisitorObject('NonComputedKey', { Identifier: visitor });
  }
  {
    const visitor = (node, location) => {
      location.getNamespace().checkCollision(node.name);
      return combineResult(makeIdentifier, node, location);
    };
    assignVisitorObject('ScopingIdentifier', { Identifier: visitor });
    assignVisitorObject('Expression', { Identifier: visitor });
    assignVisitorObject('Pattern', { Identifier: visitor });
    assignVisitorObject('RestablePattern', { Identifier: visitor });
  }
}
