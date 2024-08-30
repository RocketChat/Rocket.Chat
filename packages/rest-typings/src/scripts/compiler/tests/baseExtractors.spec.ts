import * as ts from 'typescript';

import { extractLiteralNode, extractUnionNode, extractIntersectionNode, extractReferencedNode } from '../extractors';
import { createProgram } from '../main';
import type { TypeChecker } from '../types';

const program = createProgram();
const checker: TypeChecker = program.getTypeChecker();

describe('Base Extractor functions', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('extractLiteralNode', () => {
		it('should extract data from literal node', () => {
			const mockTypeLiteralNode = ts.factory.createTypeLiteralNode([
				ts.factory.createPropertySignature(
					undefined,
					ts.factory.createIdentifier('name'),
					undefined,
					ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
				),
			]) as ts.TypeLiteralNode;
			expect(extractLiteralNode(mockTypeLiteralNode, checker)).toEqual({ name: 'any' });
		});

		it('should have optional marker when property is optional', () => {
			const mockOptionalTypeLiteralNode = ts.factory.createTypeLiteralNode([
				ts.factory.createPropertySignature(
					undefined,
					ts.factory.createIdentifier('place'),
					ts.factory.createToken(ts.SyntaxKind.QuestionToken),
					ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
				),
			]) as ts.TypeLiteralNode;
			expect(extractLiteralNode(mockOptionalTypeLiteralNode, checker)).toEqual({ 'place?': 'any' });
		});

		// it('should extract data when subnode is of Reference type', () => {
		// 	expect().toEqual();
		// });

		// it('should extract data when subnode is of Literal type', () => {
		// 	expect().toEqual();
		// });

		// it('should extract data when subnode has basic types', () => {
		// 	expect().toEqual();
		// });
	});

	describe('extractUnionNode', () => {
		it('should extract types from a UnionTypeNode', () => {
			const mockUnionTypeNode = ts.factory.createUnionTypeNode([
				ts.factory.createTypeLiteralNode([
					ts.factory.createPropertySignature(
						undefined,
						ts.factory.createIdentifier('favorite'),
						undefined,
						ts.factory.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword),
					),
				]),
				ts.factory.createTypeLiteralNode([
					ts.factory.createPropertySignature(
						undefined,
						ts.factory.createIdentifier('roomName'),
						undefined,
						ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
					),
				]),
			]);

			const result = extractUnionNode(mockUnionTypeNode, checker);
			expect(result).toEqual([{ favorite: 'any' }, { roomName: 'any' }]);
		});
	});

	describe('extractIntersectionNode', () => {
		it('should extract types from an IntersectionTypeNode', () => {
			const mockIntersectionTypeNode = ts.factory.createIntersectionTypeNode([
				ts.factory.createTypeLiteralNode([
					ts.factory.createPropertySignature(
						undefined,
						ts.factory.createIdentifier('isPrivate'),
						undefined,
						ts.factory.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword),
					),
				]),
				ts.factory.createTypeLiteralNode([
					ts.factory.createPropertySignature(
						undefined,
						ts.factory.createIdentifier('rid'),
						undefined,
						ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
					),
				]),
			]);

			const result = extractIntersectionNode(mockIntersectionTypeNode, checker);
			expect(result).toEqual({ isPrivate: 'any', rid: 'any' });
		});
	});

	// this requires use of symbol and checker -> need to mock those also to test this //
	describe('extractReferencedNode', () => {
		it('should extract information from a TypeReferenceNode', () => {
			const mockTypeReferenceNode = ts.factory.createTypeReferenceNode(
				ts.factory.createIdentifier('RoomsCreateDiscussionProps'),
				undefined,
			);
			const result = extractReferencedNode(mockTypeReferenceNode, checker);
			expect(result).toEqual({ prop: 'value' });
		});
	});
});
