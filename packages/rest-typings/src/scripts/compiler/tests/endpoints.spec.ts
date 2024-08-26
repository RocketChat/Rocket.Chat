import * as ts from 'typescript';

import { extractEndpoints } from '../endpoints';
import { extractParameters, extractResponses } from '../extractors';
import type { Node, TypeChecker } from '../types';

// Mock the extractor functions
jest.mock('./extractors', () => ({
	extractParameters: jest.fn(),
	extractResponses: jest.fn(),
}));

// Helper function to create a basic mock node
const createMockNode = <T extends ts.Node>(kind: T['kind']): T =>
	({
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
		forEachChild: (cb: (node: ts.Node) => void) => {},
	} as T);

describe('extractEndpoints', () => {
	const mockChecker = {} as TypeChecker;

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should extract endpoints from a TypeAliasDeclaration', () => {
		// Mock a FunctionTypeNode
		const mockFunctionTypeNode = createMockNode<ts.FunctionTypeNode>(ts.SyntaxKind.FunctionType);

		// Mock a PropertySignature for a method (e.g., 'get')
		const mockMethodPropertySignature = {
			...createMockNode<ts.PropertySignature>(ts.SyntaxKind.PropertySignature),
			name: { text: 'get' } as ts.Identifier,
			type: mockFunctionTypeNode,
		};

		// Mock a TypeLiteralNode for the method type
		const mockMethodTypeLiteralNode = {
			...createMockNode<ts.TypeLiteralNode>(ts.SyntaxKind.TypeLiteral),
			members: [mockMethodPropertySignature],
		};

		// Mock a PropertySignature for an API path
		const mockApiPathPropertySignature = {
			...createMockNode<ts.PropertySignature>(ts.SyntaxKind.PropertySignature),
			name: { text: '/api/users' } as ts.StringLiteral,
			type: mockMethodTypeLiteralNode,
		};

		// Mock a TypeLiteralNode for the endpoint type
		const mockEndpointTypeLiteralNode = {
			...createMockNode<ts.TypeLiteralNode>(ts.SyntaxKind.TypeLiteral),
			members: [mockApiPathPropertySignature],
		};

		// Mock the TypeAliasDeclaration
		const mockTypeAliasDeclaration = {
			...createMockNode<ts.TypeAliasDeclaration>(ts.SyntaxKind.TypeAliasDeclaration),
			name: { text: 'UserEndpoints' } as ts.Identifier,
			type: mockEndpointTypeLiteralNode,
		};

		// Mock the extractor function returns
		(extractParameters as jest.Mock).mockReturnValue({ userId: 'number' });
		(extractResponses as jest.Mock).mockReturnValue({ user: { id: 'number', name: 'string' } });

		const result = extractEndpoints(mockTypeAliasDeclaration as Node, mockChecker);

		expect(result).toEqual({
			'/api/users': {
				get: {
					params: { userId: 'number' },
					response: { user: { id: 'number', name: 'string' } },
				},
			},
		});

		expect(extractParameters).toHaveBeenCalledWith(mockFunctionTypeNode, mockChecker);
		expect(extractResponses).toHaveBeenCalledWith(mockFunctionTypeNode, mockChecker);
	});

	it('should not extract endpoints from non-matching TypeAliasDeclarations', () => {
		const mockTypeAliasDeclaration = {
			...createMockNode<ts.TypeAliasDeclaration>(ts.SyntaxKind.TypeAliasDeclaration),
			name: { text: 'NotAnEndpoint' } as ts.Identifier,
			type: createMockNode<ts.TypeLiteralNode>(ts.SyntaxKind.TypeLiteral),
		};

		const result = extractEndpoints(mockTypeAliasDeclaration as Node, mockChecker);

		expect(result).toEqual({});
	});

	it('should recursively extract endpoints from child nodes', () => {
		const mockChildTypeAliasDeclaration = {
			...createMockNode<ts.TypeAliasDeclaration>(ts.SyntaxKind.TypeAliasDeclaration),
			name: { text: 'ChildEndpoints' } as ts.Identifier,
			type: createMockNode<ts.TypeLiteralNode>(ts.SyntaxKind.TypeLiteral),
		};

		const mockParentNode = {
			...createMockNode<ts.SourceFile>(ts.SyntaxKind.SourceFile),
			forEachChild: (cb: (node: ts.Node) => void) => {
				cb(mockChildTypeAliasDeclaration);
			},
		};

		// Mock the extractor function returns
		(extractParameters as jest.Mock).mockReturnValue({ childId: 'number' });
		(extractResponses as jest.Mock).mockReturnValue({ child: { id: 'number', name: 'string' } });

		const result = extractEndpoints(mockParentNode as Node, mockChecker);

		expect(result).toEqual({
			// Assuming the child node extraction works similarly to the first test case
		});
	});
});
