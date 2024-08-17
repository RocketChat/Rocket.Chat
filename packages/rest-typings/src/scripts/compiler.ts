import * as path from 'path';

import * as ts from 'typescript';

const fileName = path.join(__dirname, '../index.ts');
const fileContent = ts.sys.readFile(fileName);

if (!fileContent) {
	console.error(`Could not read file: ${fileName}`);
	process.exit(1);
}

const program: ts.Program = ts.createProgram([fileName], {
	target: ts.ScriptTarget.ES2015,
	module: ts.ModuleKind.ESNext,
});

const checker: ts.TypeChecker = program.getTypeChecker();

/* ###################################################################################### */

const resolveType: any = (typeNode: ts.TypeNode) => {
	if (ts.isTypeLiteralNode(typeNode)) return extractLiteralNode(typeNode);
	if (ts.isTypeReferenceNode(typeNode)) return extractReferencedNode(typeNode);
	if (ts.isUnionTypeNode(typeNode)) return { unionTypes: extractUnionNode(typeNode) };
	if (ts.isIntersectionTypeNode(typeNode)) return extractIntersectionNode(typeNode);
	if (ts.isParenthesizedTypeNode(typeNode)) return resolveType(typeNode.type);
	if (ts.isLiteralTypeNode(typeNode)) return typeNode.literal.getText();

	return {}; // fallback
};

const extractLiteralNode = (typeNode: ts.TypeLiteralNode) => {
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
				const temp = extractReferencedNode(literalType);
				Object.assign(val, { [key]: temp });
			} else if (ts.isTypeLiteralNode(literalType)) {
				const temp = extractLiteralNode(literalType);
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
};

const extractUnionNode = (typeNode: ts.UnionTypeNode) => {
	const unionArr: any[] = [];
	typeNode.types?.forEach((type) => {
		const unionTemp = resolveType(type);
		unionArr.push(unionTemp);
	});

	return unionArr;
};

const extractIntersectionNode = (typeNode: ts.IntersectionTypeNode) => {
	const result: any = {};
	typeNode.types?.forEach((type) => {
		const temp = resolveType(type);

		Object.assign(result, temp);
	});

	return result;
};

// const processedTypes = new Map<string, any>(); // TODO: Add cache for already processed types
const extractReferencedNode = (typeNode: ts.TypeReferenceNode) => {
	if (!typeNode) return {};

	const params: any = {};
	if (ts.isIdentifier(typeNode.typeName)) {
		let additionalParams: any = {};
		const typename = typeNode.typeName.escapedText;

		if (typename === 'PaginatedRequest') {
			additionalParams = {
				'count?': 'number',
				'offset?': 'number',
				'sort?': 'string',
				'query?': 'string',
			};
		} else if (typename === 'PaginatedResponse' || typename === 'PaginatedResult') {
			additionalParams = {
				count: 'number',
				offset: 'number',
				total: 'number',
			};
		} else if (typename === 'Pick') {
			typeNode.typeArguments?.forEach((arg) => {
				Object.assign(additionalParams, resolveType(arg));
			});
		}
		Object.assign(params, additionalParams);
	}

	if (typeNode.typeArguments) {
		typeNode.typeArguments?.forEach((arg) => {
			Object.assign(params, resolveType(arg));
		});
	} else {
		const typeIdentifier = typeNode.typeName;
		let symbol = checker.getSymbolAtLocation(typeIdentifier);
		if (!symbol) return typeNode.getText();

		const type = checker.getTypeAtLocation(typeNode);
		const { aliasSymbol } = type;
		if (aliasSymbol && typeIdentifier.getText() !== aliasSymbol?.escapedName) {
			symbol = aliasSymbol;
		}

		symbol.declarations?.forEach((sym) => {
			if (ts.isImportSpecifier(sym) && sym.name && ts.isIdentifier(sym.name)) {
				const importName = sym.name.text;
				const result = extractImportedNode(sym);
				if (typeof result === 'string') {
					params[importName] = result;
				} else {
					Object.assign(params, result);
				}
			} else if (ts.isTypeAliasDeclaration(sym) && sym.name && ts.isIdentifier(sym.name)) {
				const symbolType = sym.type;
				if (!symbolType) return {};

				Object.assign(params, resolveType(symbolType));
			}
		});
	}

	return params;
};

const extractImportedNode = (typenode: ts.ImportSpecifier) => {
	const params: any = {};

	const importedSymbol = checker.getSymbolAtLocation(typenode.name);
	if (!importedSymbol) return typenode.getText();

	const importedAliasSymbol = checker.getAliasedSymbol(importedSymbol);
	const declarations = importedAliasSymbol.getDeclarations();

	if (!declarations) return typenode.getText();

	declarations?.forEach((sym) => {
		if (ts.isTypeAliasDeclaration(sym) && sym.name && ts.isIdentifier(sym.name)) {
			const symbolType = sym.type;
			if (!symbolType) {
				console.error('No Imported type found!');
				return {};
			}

			Object.assign(params, resolveType(symbolType));
		}
	});

	return params;
};

const extractParameters = (method: ts.FunctionTypeNode) => {
	const params: any = {};

	method.parameters?.forEach((param) => {
		const paramType = param.type;
		if (!paramType) {
			console.error('Param Type Not Found!');
			return {};
		}

		const subParam = resolveType(paramType);

		Object.assign(params, subParam);
	});

	return params;
};

const extractResponses = (method: ts.FunctionTypeNode) => {
	const responseType = method.type;
	if (!responseType) {
		console.error('Response Not Found');
		return {};
	}

	return resolveType(responseType);
};

const extractEndpoints = (node: ts.Node, endpoints: any = {}) => {
	const regex = /.*Endpoints$/;

	if (ts.isTypeAliasDeclaration(node) && regex.test(node.name.text)) {
		const endpointType = node.type as ts.TypeLiteralNode;
		endpointType.members?.forEach((member) => {
			if (ts.isPropertySignature(member) && member.name && ts.isStringLiteral(member.name)) {
				const apiPath = member.name.text;
				const methodType = member.type as ts.TypeLiteralNode;

				endpoints[apiPath] = {};

				methodType.members?.forEach((methodMember) => {
					if (ts.isPropertySignature(methodMember) && methodMember.name && ts.isIdentifier(methodMember.name)) {
						const methodName = methodMember.name.text;
						const method = methodMember.type as ts.FunctionTypeNode;

						endpoints[apiPath][methodName] = {
							params: extractParameters(method),
							response: extractResponses(method),
						};
					}
				});
			}
		});
	}

	ts.forEachChild(node, (childNode) => extractEndpoints(childNode, endpoints));
};

function getFormatedFilename(path: string) {
	const parts = path.split('/');
	const filenameWithExtension = parts.pop();

	if (!filenameWithExtension) return console.error('No fileName Found');
	const filename = filenameWithExtension.replace(/\.[^/.]+$/, ' Endpoints');

	return filename.toUpperCase();
}

const endpoints: any = {};
const nonDeclarationFiles: ts.SourceFile[] = program.getSourceFiles().filter((file) => !file.isDeclarationFile);
nonDeclarationFiles.forEach((file) => {
	const filename: string = getFormatedFilename(file.fileName) as string;
	const temp = {};
	extractEndpoints(file, temp);

	if (Object.keys(temp).length) endpoints[filename] = temp;
});

console.log(JSON.stringify(endpoints));

export default endpoints;
