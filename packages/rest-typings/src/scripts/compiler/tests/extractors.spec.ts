import * as ts from 'typescript';

import {
	extractLiteralNode,
	extractUnionNode,
	extractIntersectionNode,
	extractReferencedNode,
	extractParameters,
	extractResponses,
} from '../extractors';
import { resolveType } from '../resolver';
import type { TypeChecker } from '../types';

// Mock the resolveType function
jest.mock('./resolver', () => ({
	resolveType: jest.fn(),
}));

// Helper function to create a basic mock node
const createMockNode = <T extends ts.Node>(kind: T['kind']) => ({
	kind,
	flags: 0,
	parent: undefined,
	pos: 0,
	end: 0,
	getSourceFile: () => undefined,
	getChildCount: () => 0,
	getChildAt: () => undefined,
	getChildren: () => [],
	getStart: () => 0,
	getFullStart: () => 0,
	getEnd: () => 0,
	getWidth: () => 0,
	getFullWidth: () => 0,
	getLeadingTriviaWidth: () => 0,
	getFullText: () => '',
	getText: () => '',
	forEachChild: () => undefined,
});

describe('Extractor functions', () => {
	const mockChecker = {
		getTypeAtLocation: jest.fn(),
		typeToString: jest.fn(),
		getSymbolAtLocation: jest.fn(),
		getAliasedSymbol: jest.fn(),
	} as unknown as TypeChecker;

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('extractLiteralNode', () => {
		it('should extract properties from a TypeLiteralNode', () => {
			const mockPropertySignature = {
				...createMockNode<ts.PropertySignature>(ts.SyntaxKind.PropertySignature),
				name: { text: 'propName' } as ts.Identifier,
				type: createMockNode<ts.TypeNode>(ts.SyntaxKind.StringKeyword),
			};

			const mockTypeLiteralNode = {
				...createMockNode<ts.TypeLiteralNode>(ts.SyntaxKind.TypeLiteral),
				members: [mockPropertySignature],
			};

			(mockChecker.getTypeAtLocation as jest.Mock).mockReturnValue({});
			(mockChecker.typeToString as jest.Mock).mockReturnValue('string');

			const result = extractLiteralNode(mockTypeLiteralNode, mockChecker);
			expect(result).toEqual({ propName: 'string' });
		});
	});

	describe('extractUnionNode', () => {
		it('should extract types from a UnionTypeNode', () => {
			const mockUnionTypeNode = {
				...createMockNode<ts.UnionTypeNode>(ts.SyntaxKind.UnionType),
				types: [createMockNode<ts.TypeNode>(ts.SyntaxKind.StringKeyword), createMockNode<ts.TypeNode>(ts.SyntaxKind.NumberKeyword)],
			};

			(resolveType as jest.Mock).mockReturnValueOnce('string').mockReturnValueOnce('number');

			const result = extractUnionNode(mockUnionTypeNode, mockChecker);
			expect(result).toEqual(['string', 'number']);
		});
	});

	describe('extractIntersectionNode', () => {
		it('should extract types from an IntersectionTypeNode', () => {
			const mockIntersectionTypeNode = {
				...createMockNode<ts.IntersectionTypeNode>(ts.SyntaxKind.IntersectionType),
				types: [createMockNode<ts.TypeNode>(ts.SyntaxKind.TypeLiteral), createMockNode<ts.TypeNode>(ts.SyntaxKind.TypeLiteral)],
			};

			(resolveType as jest.Mock).mockReturnValueOnce({ prop1: 'string' }).mockReturnValueOnce({ prop2: 'number' });

			const result = extractIntersectionNode(mockIntersectionTypeNode, mockChecker);
			expect(result).toEqual({ prop1: 'string', prop2: 'number' });
		});
	});

	describe('extractReferencedNode', () => {
		it('should extract information from a TypeReferenceNode', () => {
			const mockTypeReferenceNode = {
				...createMockNode<ts.TypeReferenceNode>(ts.SyntaxKind.TypeReference),
				typeName: { escapedText: 'ReferencedType' } as ts.Identifier,
			};

			(mockChecker.getSymbolAtLocation as jest.Mock).mockReturnValue({
				declarations: [
					{
						...createMockNode<ts.TypeAliasDeclaration>(ts.SyntaxKind.TypeAliasDeclaration),
						type: createMockNode<ts.TypeNode>(ts.SyntaxKind.TypeLiteral),
					},
				],
			});

			(resolveType as jest.Mock).mockReturnValue({ prop: 'value' });

			const result = extractReferencedNode(mockTypeReferenceNode, mockChecker);
			expect(result).toEqual({ prop: 'value' });
		});
	});

	describe('extractParameters', () => {
		it('should extract parameters from a FunctionTypeNode', () => {
			const mockParameter = {
				...createMockNode<ts.ParameterDeclaration>(ts.SyntaxKind.Parameter),
				type: createMockNode<ts.TypeNode>(ts.SyntaxKind.StringKeyword),
			};

			const mockFunctionTypeNode = {
				...createMockNode<ts.FunctionTypeNode>(ts.SyntaxKind.FunctionType),
				parameters: [mockParameter],
			};

			(resolveType as jest.Mock).mockReturnValue({ param: 'string' });

			const result = extractParameters(mockFunctionTypeNode, mockChecker);
			expect(result).toEqual({ param: 'string' });
		});
	});

	describe('extractResponses', () => {
		it('should extract response type from a FunctionTypeNode', () => {
			const mockFunctionTypeNode = {
				...createMockNode<ts.FunctionTypeNode>(ts.SyntaxKind.FunctionType),
				type: createMockNode<ts.TypeNode>(ts.SyntaxKind.StringKeyword),
			};

			(resolveType as jest.Mock).mockReturnValue('string');

			const result = extractResponses(mockFunctionTypeNode, mockChecker);
			expect(result).toBe('string');
		});
	});
});
