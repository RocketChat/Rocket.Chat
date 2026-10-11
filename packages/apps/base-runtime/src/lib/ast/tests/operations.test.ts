/* eslint-disable @typescript-eslint/no-non-null-assertion -- acceptable for this test file */
import * as assert from 'node:assert';
import { beforeEach, describe, it } from 'node:test';

import type {
	AnyNode,
	ArrowFunctionExpression,
	AssignmentExpression,
	AwaitExpression,
	Expression,
	MethodDefinition,
	ReturnStatement,
	VariableDeclaration,
} from 'acorn';

import type { WalkerState } from '../operations';
import {
	asyncifyScope,
	buildFixModifiedFunctionsOperation,
	checkReassignmentOfModifiedIdentifiers,
	getFunctionIdentifier,
	wrapWithAwait,
} from '../operations';
import {
	ArrowFunctionDerefCallExpression,
	AssignmentExpressionOfArrowFunctionToFooIdentifier,
	AssignmentExpressionOfNamedFunctionToFooMemberExpression,
	AssignmentOfFooToBar,
	AssignmentOfFooToBarMemberExpression,
	AssignmentOfFooToBarPropertyDefinition,
	AssignmentOfFooToBarVariableDeclarator,
	ConstFooAssignedFunctionExpression,
	FixSimpleCallExpression,
	FunctionDeclarationFoo,
	MethodDefinitionOfFooInClassBar,
	SimpleCallExpressionOfFoo,
	SyncFunctionDeclarationWithAsyncCallExpression,
} from './data/ast_blocks';

describe('getFunctionIdentifier', () => {
	it(`identifies the name "foo" for the code \`${FunctionDeclarationFoo.code}\``, () => {
		// ancestors array is built by the walking lib
		const nodeAncestors = [FunctionDeclarationFoo.node];
		const functionNodeIndex = 0;
		assert.deepStrictEqual('foo', getFunctionIdentifier(nodeAncestors, functionNodeIndex));
	});

	it(`identifies the name "foo" for the code \`${ConstFooAssignedFunctionExpression.code}\``, () => {
		// ancestors array is built by the walking lib
		const nodeAncestors = [
			ConstFooAssignedFunctionExpression.node, // VariableDeclaration
			ConstFooAssignedFunctionExpression.node.declarations[0], // VariableDeclarator
			ConstFooAssignedFunctionExpression.node.declarations[0].init!, // FunctionExpression
		];
		const functionNodeIndex = 2;
		assert.deepStrictEqual('foo', getFunctionIdentifier(nodeAncestors, functionNodeIndex));
	});

	it(`identifies the name "foo" for the code \`${AssignmentExpressionOfArrowFunctionToFooIdentifier.code}\``, () => {
		// ancestors array is built by the walking lib
		const nodeAncestors = [
			AssignmentExpressionOfArrowFunctionToFooIdentifier.node, // ExpressionStatement
			AssignmentExpressionOfArrowFunctionToFooIdentifier.node.expression, // AssignmentExpression
			(AssignmentExpressionOfArrowFunctionToFooIdentifier.node.expression as AssignmentExpression).right, // ArrowFunctionExpression
		];
		const functionNodeIndex = 2;
		assert.deepStrictEqual('foo', getFunctionIdentifier(nodeAncestors, functionNodeIndex));
	});

	it(`identifies the name "foo" for the code \`${AssignmentExpressionOfNamedFunctionToFooMemberExpression.code}\``, () => {
		// ancestors array is built by the walking lib
		const nodeAncestors = [
			AssignmentExpressionOfNamedFunctionToFooMemberExpression.node, // ExpressionStatement
			AssignmentExpressionOfNamedFunctionToFooMemberExpression.node.expression, // AssignmentExpression
			(AssignmentExpressionOfNamedFunctionToFooMemberExpression.node.expression as AssignmentExpression).right, // FunctionExpression
		];
		const functionNodeIndex = 2;
		assert.deepStrictEqual('foo', getFunctionIdentifier(nodeAncestors, functionNodeIndex));
	});

	it(`identifies the name "foo" for the code \`${MethodDefinitionOfFooInClassBar.code}\``, () => {
		// ancestors array is built by the walking lib
		const nodeAncestors = [
			MethodDefinitionOfFooInClassBar.node, // ClassDeclaration
			MethodDefinitionOfFooInClassBar.node.body, // ClassBody
			MethodDefinitionOfFooInClassBar.node.body!.body[0], // MethodDefinition
			(MethodDefinitionOfFooInClassBar.node.body!.body[0] as MethodDefinition).value, // FunctionExpression
		];
		const functionNodeIndex = 3;
		assert.deepStrictEqual('foo', getFunctionIdentifier(nodeAncestors, functionNodeIndex));
	});
});

describe('wrapWithAwait', () => {
	it('wraps a call expression with await', () => {
		const node = structuredClone(SimpleCallExpressionOfFoo.node.expression);
		wrapWithAwait(node);

		assert.deepStrictEqual('AwaitExpression', node.type);
		assert.notDeepStrictEqual(SimpleCallExpressionOfFoo.node.expression.type, node.type);
		assert.deepStrictEqual(SimpleCallExpressionOfFoo.node.expression, (node as AwaitExpression).argument);
	});

	it('throws if node is not an expression', () => {
		const node = structuredClone(SimpleCallExpressionOfFoo.node);
		assert.throws(() => wrapWithAwait(node as unknown as Expression));
	});
});

describe('asyncifyScope', () => {
	it('makes only the first function scope async', () => {
		const node = structuredClone(SyncFunctionDeclarationWithAsyncCallExpression.node);
		const ancestors: AnyNode[] = [
			node, // FunctionDeclaration
			node.body, // BlockStatement
			node.body!.body[0], // ReturnStatement
			(node.body!.body[0] as ReturnStatement).argument!, // ArrowFunctionExpression
			((node.body!.body[0] as ReturnStatement).argument! as ArrowFunctionExpression).body, // AwaitExpression
			(((node.body!.body[0] as ReturnStatement).argument! as ArrowFunctionExpression).body as AwaitExpression).argument, // CallExpression
		];
		const state: WalkerState = {
			isModified: false,
			functionIdentifiers: new Set(),
		};

		asyncifyScope(ancestors, state);

		// Assert the function did indeed change the expression to async
		assert.deepStrictEqual(((node.body.body[0] as ReturnStatement).argument as ArrowFunctionExpression).async, true);

		// Assert the function did NOT change all ancestors in the chain
		assert.deepStrictEqual(node.async, false);

		// Assert it couldn't find a function identifier
		assert.deepStrictEqual(state.functionIdentifiers.size, 0);
	});
});

describe('checkReassignmentofModifiedIdentifiers', () => {
	it(`identifies the reassignment of "foo" in the code "${AssignmentOfFooToBar.code}"`, () => {
		const node = structuredClone(AssignmentOfFooToBar.node);
		const ancestors: AnyNode[] = [
			node, // ExpressionStatement
			node.expression, // AssignmentExpression
			(node.expression as AssignmentExpression).right, // Identifier
		];
		const state: WalkerState = {
			isModified: true,
			functionIdentifiers: new Set(['foo']),
		};

		checkReassignmentOfModifiedIdentifiers(node.expression, state, ancestors, '');

		assert.deepStrictEqual(state.functionIdentifiers.has('bar'), true);
	});

	it(`identifies the reassignment of "foo" in the code "${AssignmentOfFooToBarMemberExpression.code}"`, () => {
		const node = structuredClone(AssignmentOfFooToBarMemberExpression.node);
		const ancestors: AnyNode[] = [
			node, // ExpressionStatement
			node.expression, // AssignmentExpression
			(node.expression as AssignmentExpression).right, // Identifier
		];
		const state: WalkerState = {
			isModified: true,
			functionIdentifiers: new Set(['foo']),
		};

		checkReassignmentOfModifiedIdentifiers(node.expression, state, ancestors, '');

		assert.deepStrictEqual(state.functionIdentifiers.has('bar'), true);
	});

	it(`identifies the reassignment of "foo" in the code "${AssignmentOfFooToBarVariableDeclarator.code}"`, () => {
		const node = structuredClone(AssignmentOfFooToBarVariableDeclarator.node);
		const ancestors: AnyNode[] = [
			node, // VariableDeclaration
			node.declarations[0], // VariableDeclarator
		];
		const state: WalkerState = {
			isModified: true,
			functionIdentifiers: new Set(['foo']),
		};

		checkReassignmentOfModifiedIdentifiers(node.declarations[0], state, ancestors, '');

		assert.deepStrictEqual(state.functionIdentifiers.has('bar'), true);
	});

	it(`identifies the reassignment of "foo" in the code "${AssignmentOfFooToBarPropertyDefinition.code}"`, () => {
		const node = structuredClone(AssignmentOfFooToBarPropertyDefinition.node);
		const ancestors: AnyNode[] = [
			node, // ClassDeclaration
			node.body, // ClassBody
			node.body.body[0], // PropertyDefinition
		];
		const state: WalkerState = {
			isModified: true,
			functionIdentifiers: new Set(['foo']),
		};

		checkReassignmentOfModifiedIdentifiers(node.body.body[0], state, ancestors, '');

		assert.deepStrictEqual(state.functionIdentifiers.has('bar'), true);
	});
});

describe('buildFixModifiedFunctionsOperation', function () {
	const state: WalkerState = {
		isModified: false,
		functionIdentifiers: new Set(['foo']),
	};

	const fixFunction = buildFixModifiedFunctionsOperation(state.functionIdentifiers);

	beforeEach(() => {
		state.isModified = false;
		state.functionIdentifiers = new Set(['foo']);
	});

	it(`fixes calls of "foo" in the code "${FixSimpleCallExpression.code}"`, () => {
		const node = structuredClone(FixSimpleCallExpression.node);
		const ancestors: AnyNode[] = [
			node, // FunctionDeclaration
			node.body, // BlockStatement
			node.body.body[0], // VariableDeclaration
			(node.body.body[0] as VariableDeclaration).declarations[0], // VariableDeclarator
			(node.body.body[0] as VariableDeclaration).declarations[0].init!, // CallExpression
		];

		fixFunction(ancestors[4], state, ancestors, '');

		assert.deepStrictEqual(state.isModified, true);
		assert.deepStrictEqual(state.functionIdentifiers.has('bar'), true);
		assert.notDeepStrictEqual(FixSimpleCallExpression.node, node);
		assert.deepStrictEqual(node.async, true);
		assert.deepStrictEqual(ancestors[4].type, 'AwaitExpression');
	});

	it(`fixes calls of "foo" in the code "${ArrowFunctionDerefCallExpression.code}"`, () => {
		const node = structuredClone(ArrowFunctionDerefCallExpression.node);
		const ancestors: AnyNode[] = [
			node, // VariableDeclaration
			node.declarations[0], // VariableDeclarator
			node.declarations[0].init!, // ArrowFunctionExpression
			(node.declarations[0].init as ArrowFunctionExpression).body, // CallExpression
		];

		fixFunction(ancestors[3], state, ancestors, '');

		// Recorded that a modification has been made
		assert.deepStrictEqual(state.isModified, true);
		// Recorded that the enclosing scope of the call also requires fixing
		assert.deepStrictEqual(state.functionIdentifiers.has('bar'), true);
		// Original node and fixed node are different
		assert.notDeepStrictEqual(ArrowFunctionDerefCallExpression.node, node);
		// The function call is now await'ed
		assert.deepStrictEqual(ancestors[3].type, 'AwaitExpression');
		// The parent function of the call is now marked as async
		assert.deepStrictEqual((ancestors[2] as ArrowFunctionExpression).async, true);
	});
});
