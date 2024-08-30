import * as ts from 'typescript';

import { resolveType } from './resolver';
import type { TypeChecker } from './types';

export function extractLiteralNode(typeNode: ts.TypeLiteralNode, checker: TypeChecker): any {
	if (!typeNode) return {};

	const properties: any = {};
	typeNode.members?.forEach((member) => {
		if (ts.isPropertySignature(member) && member.name && ts.isIdentifier(member.name)) {
			let key = member.name.text;
			const literalType = member.type;
			if (member.questionToken) key += '?';

			if (!literalType) {
				console.error(`Type value not present at: ${key}`);
				return;
			}

			const val: any = {};
			if (ts.isTypeReferenceNode(literalType)) {
				const temp = extractReferencedNode(literalType, checker);
				Object.assign(val, { [key]: temp });
			} else if (ts.isTypeLiteralNode(literalType)) {
				const temp = extractLiteralNode(literalType, checker);
				val[key] = temp;
			} else {
				const valueType = checker.getTypeAtLocation(literalType);
				const value = checker.typeToString(valueType);
				val[key] = value;
			}

			Object.assign(properties, val);
		}
	});

	return properties;
}

export function extractUnionNode(typeNode: ts.UnionTypeNode, checker: TypeChecker): any[] {
	const unionArr: any[] = [];
	typeNode.types?.forEach((type) => {
		const unionTemp = resolveType(type, checker);
		unionArr.push(unionTemp);
	});

	return unionArr;
}

export function extractIntersectionNode(typeNode: ts.IntersectionTypeNode, checker: TypeChecker): any {
	const result: any = {};
	typeNode.types?.forEach((type) => {
		Object.assign(result, resolveType(type, checker));
	});
	return result;
}

export function extractReferencedNode(typeNode: ts.TypeReferenceNode, checker: TypeChecker): any {
	if (!typeNode) return {};

	const params: any = {};
	if (ts.isIdentifier(typeNode.typeName)) {
		const typename = typeNode.typeName.escapedText.toString();
		Object.assign(params, handleSpecialTypes(typename, typeNode, checker));
	}

	if (typeNode.typeArguments) {
		typeNode.typeArguments.forEach((arg) => {
			Object.assign(params, resolveType(arg, checker));
		});
	} else {
		const symbol = getSymbolFromTypeNode(typeNode, checker);
		if (symbol) {
			symbol.declarations?.forEach((sym) => {
				if (ts.isImportSpecifier(sym) && sym.name && ts.isIdentifier(sym.name)) {
					const importName = sym.name.text;
					const result = extractImportedNode(sym, checker);
					if (typeof result === 'string') {
						params[importName] = result;
					} else {
						Object.assign(params, result);
					}
				} else if (ts.isTypeAliasDeclaration(sym) && sym.type) {
					Object.assign(params, resolveType(sym.type, checker));
				}
			});
		}
	}

	return params;
}

function handleSpecialTypes(typename: string, typeNode: ts.TypeReferenceNode, checker: TypeChecker): any {
	const specialTypes: Record<string, any> = {
		PaginatedRequest: {
			'count?': 'number',
			'offset?': 'number',
			'sort?': 'string',
			'query?': 'string',
		},
		PaginatedResponse: {
			count: 'number',
			offset: 'number',
			total: 'number',
		},
		PaginatedResult: {
			count: 'number',
			offset: 'number',
			total: 'number',
		},
		Pick: {},
	};

	if (typename in specialTypes) {
		const result = { ...specialTypes[typename] };
		if (typename === 'Pick' && typeNode.typeArguments) {
			typeNode.typeArguments.forEach((arg) => {
				Object.assign(result, resolveType(arg, checker));
			});
		}
		return result;
	}

	return {};
}

function getSymbolFromTypeNode(typeNode: ts.TypeReferenceNode, checker: TypeChecker): ts.Symbol | undefined {
	const typeIdentifier = typeNode.typeName;
	let symbol = checker.getSymbolAtLocation(typeIdentifier);
	if (!symbol) return undefined;

	const type = checker.getTypeAtLocation(typeNode);
	const { aliasSymbol } = type;
	if (aliasSymbol && typeIdentifier.getText() !== aliasSymbol?.escapedName) {
		symbol = aliasSymbol;
	}

	return symbol;
}

function extractImportedNode(typenode: ts.ImportSpecifier, checker: TypeChecker): any {
	const params: any = {};

	const importedSymbol = checker.getSymbolAtLocation(typenode.name);
	if (!importedSymbol) return typenode.getText();

	const importedAliasSymbol = checker.getAliasedSymbol(importedSymbol);
	const declarations = importedAliasSymbol.getDeclarations();

	if (!declarations) return typenode.getText();

	declarations.forEach((sym) => {
		if (ts.isTypeAliasDeclaration(sym) && sym.name && ts.isIdentifier(sym.name)) {
			const symbolType = sym.type;
			if (!symbolType) {
				console.error('No Imported type found!');
				return;
			}

			Object.assign(params, resolveType(symbolType, checker));
		}
	});

	return params;
}

export function extractParameters(method: ts.FunctionTypeNode, checker: TypeChecker): any {
	const params: any = {};

	method.parameters?.forEach((param) => {
		const paramType = param.type;
		if (!paramType) {
			console.error('Param Type Not Found!');
			return;
		}

		const subParam = resolveType(paramType, checker);
		Object.assign(params, subParam);
	});

	return params;
}

export function extractResponses(method: ts.FunctionTypeNode, checker: TypeChecker): any {
	const responseType = method.type;
	if (!responseType) {
		console.error('Response Not Found');
		return {};
	}

	return resolveType(responseType, checker);
}
