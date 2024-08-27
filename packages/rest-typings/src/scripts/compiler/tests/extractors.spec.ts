import * as ts from 'typescript';

import { extractParameters, extractResponses } from '../extractors';
import { createProgram } from '../main';
import type { TypeChecker } from '../types';

const program = createProgram();
const checker: TypeChecker = program.getTypeChecker();

const mockFunctionTypeNode = ts.factory.createFunctionTypeNode(
	undefined,
	[
		ts.factory.createParameterDeclaration(
			undefined,
			undefined,
			ts.factory.createIdentifier('params'),
			undefined,
			ts.factory.createTypeLiteralNode([
				ts.factory.createPropertySignature(
					undefined,
					ts.factory.createIdentifier('description'),
					undefined,
					ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
				),
			]),
			undefined,
		),
	],
	ts.factory.createTypeLiteralNode([
		ts.factory.createPropertySignature(
			undefined,
			ts.factory.createIdentifier('discussion'),
			undefined,
			ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
		),
	]),
);

describe('Extractor functions', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('extractParameters', () => {
		it('should extract literal parameters from a FunctionTypeNode', () => {
			const result = extractParameters(mockFunctionTypeNode, checker);
			expect(result).toEqual({ description: 'any' });
		});

		// it('should extract referenced parameters from a FunctionTypeNode', () => {
		// 	const result = extractParameters(mockFunctionTypeNode, checker);
		// 	expect(result).toEqual({ param: IMessage });
		// });
	});

	describe('extractResponses', () => {
		it('should extract response type from a FunctionTypeNode', () => {
			const result = extractResponses(mockFunctionTypeNode, checker);
			expect(result).toEqual({ discussion: 'any' });
		});
	});
});
