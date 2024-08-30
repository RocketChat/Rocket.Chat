import * as ts from 'typescript';

import * as extractors from '../extractors';
import { resolveType } from '../resolver';

// Mock the extractors
jest.mock('../extractors', () => ({
	extractLiteralNode: jest.fn(),
	extractReferencedNode: jest.fn(),
	extractUnionNode: jest.fn(),
	extractIntersectionNode: jest.fn(),
}));

describe('resolveType', () => {
	const mockChecker = {} as ts.TypeChecker;

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should handle TypeLiteralNode', () => {
		const mockLiteralNode = ts.factory.createTypeLiteralNode([
			ts.factory.createPropertySignature(
				undefined,
				ts.factory.createIdentifier('prop'),
				undefined,
				ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
			),
		]) as ts.TypeLiteralNode;

		(extractors.extractLiteralNode as jest.Mock).mockReturnValue({ prop: 'value' });

		const result = resolveType(mockLiteralNode, mockChecker);
		// console.log(result);

		expect(extractors.extractLiteralNode).toHaveBeenCalledWith(mockLiteralNode, mockChecker);
		expect(result).toEqual({ prop: 'value' });
	});

	it('should handle TypeReferenceNode', () => {
		const mockNode = { kind: ts.SyntaxKind.TypeReference } as ts.TypeReferenceNode;
		(extractors.extractReferencedNode as jest.Mock).mockReturnValue({ refProp: 'refValue' });

		const result = resolveType(mockNode, mockChecker);

		expect(extractors.extractReferencedNode).toHaveBeenCalledWith(mockNode, mockChecker);
		expect(result).toEqual({ refProp: 'refValue' });
	});

	it('should handle UnionTypeNode', () => {
		const mockNode = { kind: ts.SyntaxKind.UnionType } as ts.UnionTypeNode;
		(extractors.extractUnionNode as jest.Mock).mockReturnValue(['type1', 'type2']);

		const result = resolveType(mockNode, mockChecker);

		expect(extractors.extractUnionNode).toHaveBeenCalledWith(mockNode, mockChecker);
		expect(result).toEqual({ unionTypes: ['type1', 'type2'] });
	});

	it('should handle IntersectionTypeNode', () => {
		const mockNode = { kind: ts.SyntaxKind.IntersectionType } as ts.IntersectionTypeNode;
		(extractors.extractIntersectionNode as jest.Mock).mockReturnValue({ prop1: 'value1', prop2: 'value2' });

		const result = resolveType(mockNode, mockChecker);

		expect(extractors.extractIntersectionNode).toHaveBeenCalledWith(mockNode, mockChecker);
		expect(result).toEqual({ prop1: 'value1', prop2: 'value2' });
	});

	it('should handle ParenthesizedTypeNode', () => {
		const innerNode = { kind: ts.SyntaxKind.StringKeyword } as ts.KeywordTypeNode;
		const mockNode = {
			kind: ts.SyntaxKind.ParenthesizedType,
			type: innerNode,
		} as ts.ParenthesizedTypeNode;

		const result = resolveType(mockNode, mockChecker);

		expect(result).toEqual({}); // As our mock doesn't handle KeywordTypeNode
	});

	it('should handle LiteralTypeNode', () => {
		const mockNode = {
			kind: ts.SyntaxKind.LiteralType,
			literal: { getText: () => '"literal"' },
		} as unknown as ts.LiteralTypeNode;

		const result = resolveType(mockNode, mockChecker);

		expect(result).toBe('"literal"');
	});

	it('should return empty object for unknown node types', () => {
		const mockNode = { kind: ts.SyntaxKind.Unknown } as unknown as ts.TypeNode;

		const result = resolveType(mockNode, mockChecker);

		expect(result).toEqual({});
	});
});
