import * as ts from 'typescript';

export const resolveType = (typeNode: ts.TypeNode) => {
	if (ts.isLiteralTypeNode(typeNode)) {
		return typeNode.literal.getText();
	}

	// if (ts.isTypeLiteralNode(typeNode)) {
	// 	extractLiteralNode(typeNode, temp);
	// } else if (ts.isTypeReferenceNode(typeNode)) {
	// 	extractReferencedNode(typeNode, temp);
	// } else if (ts.isUnionTypeNode(typeNode)) {
	// 	const unionArr: any = [];
	// 	temp.unionTypes = extractUnionNode(typeNode, unionArr);
	// } else if (ts.isIntersectionTypeNode(typeNode)) {
	// 	extractIntersectionNode(typeNode, temp);
	// } else if (ts.isParenthesizedTypeNode(typeNode)) {
	// 	const parenthesisType = typeNode.type;
	// 	resolveType(parenthesisType, temp);
	// } else if (ts.isLiteralTypeNode(typeNode)) {
	// 	const typeLitral = typeNode.literal;
	// 	temp = typeLitral.getText();
	// }
};
