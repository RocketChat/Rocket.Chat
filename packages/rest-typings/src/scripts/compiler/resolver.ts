import * as ts from 'typescript';

import { extractLiteralNode, extractReferencedNode, extractUnionNode, extractIntersectionNode } from './extractors';
import type { TypeNode, TypeChecker } from './types';

export function resolveType(typeNode: TypeNode, checker: TypeChecker): any {
	if (ts.isTypeLiteralNode(typeNode)) return extractLiteralNode(typeNode, checker);
	if (ts.isTypeReferenceNode(typeNode)) return extractReferencedNode(typeNode, checker);
	if (ts.isUnionTypeNode(typeNode)) return { unionTypes: extractUnionNode(typeNode, checker) };
	if (ts.isIntersectionTypeNode(typeNode)) return extractIntersectionNode(typeNode, checker);
	if (ts.isParenthesizedTypeNode(typeNode)) return resolveType(typeNode.type, checker);
	if (ts.isLiteralTypeNode(typeNode)) return typeNode.literal.getText();

	return {}; // fallback
}
