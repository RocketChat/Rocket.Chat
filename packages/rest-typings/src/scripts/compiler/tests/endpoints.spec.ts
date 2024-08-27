import * as ts from 'typescript';

import { extractEndpoints } from '../endpoints';
import { extractParameters, extractResponses } from '../extractors';
import { createProgram } from '../main';
import type { Node, TypeChecker } from '../types';

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
					ts.factory.createIdentifier('userId'),
					undefined,
					ts.factory.createLiteralTypeNode(ts.factory.createStringLiteral('number')),
				),
			]),
			undefined,
		),
	],
	ts.factory.createTypeLiteralNode([
		ts.factory.createPropertySignature(
			undefined,
			ts.factory.createIdentifier('response'),
			undefined,
			ts.factory.createTypeLiteralNode([
				ts.factory.createPropertySignature(
					undefined,
					ts.factory.createIdentifier('user'),
					undefined,
					ts.factory.createTypeLiteralNode([
						ts.factory.createPropertySignature(
							undefined,
							ts.factory.createIdentifier('id'),
							undefined,
							ts.factory.createLiteralTypeNode(ts.factory.createStringLiteral('number')),
						),
						ts.factory.createPropertySignature(
							undefined,
							ts.factory.createIdentifier('name'),
							undefined,
							ts.factory.createLiteralTypeNode(ts.factory.createStringLiteral('string')),
						),
					]),
				),
			]),
		),
	]),
);

const mockNode = [
	ts.factory.createImportDeclaration(
		undefined,
		ts.factory.createImportClause(
			true,
			undefined,
			ts.factory.createNamedImports([
				ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier('IMessage')),
				ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier('IRoom')),
				ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier('IUser')),
				ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier('RoomAdminFieldsType')),
				ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier('IUpload')),
				ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier('IE2EEMessage')),
			]),
		),
		ts.factory.createStringLiteral('@rocket.chat/core-typings'),
		undefined,
	),
	ts.factory.createImportDeclaration(
		undefined,
		ts.factory.createImportClause(
			true,
			undefined,
			ts.factory.createNamedImports([ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier('PaginatedRequest'))]),
		),
		ts.factory.createStringLiteral('../helpers/PaginatedRequest'),
		undefined,
	),
	ts.factory.createImportDeclaration(
		undefined,
		ts.factory.createImportClause(
			true,
			undefined,
			ts.factory.createNamedImports([ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier('PaginatedResult'))]),
		),
		ts.factory.createStringLiteral('../helpers/PaginatedResult'),
		undefined,
	),
	ts.factory.createTypeAliasDeclaration(
		undefined,
		ts.factory.createIdentifier('RoomsAutoCompleteChannelAndPrivateProps'),
		undefined,
		ts.factory.createTypeLiteralNode([
			ts.factory.createPropertySignature(
				undefined,
				ts.factory.createIdentifier('selector'),
				undefined,
				ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
			),
		]),
	),
	ts.factory.createTypeAliasDeclaration(
		[ts.factory.createToken(ts.SyntaxKind.ExportKeyword)],
		ts.factory.createIdentifier('RoomsImagesProps'),
		undefined,
		ts.factory.createTypeLiteralNode([
			ts.factory.createPropertySignature(
				undefined,
				ts.factory.createIdentifier('roomId'),
				undefined,
				ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
			),
			ts.factory.createPropertySignature(
				undefined,
				ts.factory.createIdentifier('startingFromId'),
				ts.factory.createToken(ts.SyntaxKind.QuestionToken),
				ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
			),
			ts.factory.createPropertySignature(
				undefined,
				ts.factory.createIdentifier('count'),
				ts.factory.createToken(ts.SyntaxKind.QuestionToken),
				ts.factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword),
			),
			ts.factory.createPropertySignature(
				undefined,
				ts.factory.createIdentifier('offset'),
				ts.factory.createToken(ts.SyntaxKind.QuestionToken),
				ts.factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword),
			),
		]),
	),
	ts.factory.createTypeAliasDeclaration(
		[ts.factory.createToken(ts.SyntaxKind.ExportKeyword)],
		ts.factory.createIdentifier('RoomsEndpoints'),
		undefined,
		ts.factory.createTypeLiteralNode([
			ts.factory.createPropertySignature(
				undefined,
				ts.factory.createStringLiteral('v1/rooms.getUser'),
				undefined,
				ts.factory.createTypeLiteralNode([
					ts.factory.createPropertySignature(undefined, ts.factory.createIdentifier('GET'), undefined, mockFunctionTypeNode),
				]),
			),
		]),
	),
] as unknown as Node;

describe('extractEndpoints', () => {
	const mockChecker = {} as TypeChecker;

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should extract endpoints from a given file', () => {
		const result = extractEndpoints(mockNode, checker);

		expect(result).toEqual({
			'v1/rooms.getUser': {
				get: {
					params: { userId: 'number' },
					response: { user: { id: 'number', name: 'string' } },
				},
			},
		});

		expect(extractParameters).toHaveBeenCalledWith(mockFunctionTypeNode, mockChecker);
		expect(extractResponses).toHaveBeenCalledWith(mockFunctionTypeNode, mockChecker);
	});

	// it('should not extract endpoints from non-matching TypeAliasDeclarations', () => {
	// 	const result = extractEndpoints(mockIncorrectNode as Node, mockChecker);

	// 	expect(result).toEqual({});
	// });
});
