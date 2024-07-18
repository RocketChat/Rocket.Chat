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
const resolveType = (typeNode: ts.TypeNode, temp: any = {}) => {
	if (ts.isTypeLiteralNode(typeNode)) {
		extractLiteralNode(typeNode, temp);
	} else if (ts.isTypeReferenceNode(typeNode)) {
		// Handle case for PaginatedRequest | PaginatedResponse
		if (ts.isIdentifier(typeNode.typeName)) {
			let paginationParams: any = {};
			if (typeNode.typeName.escapedText === 'PaginatedRequest') {
				paginationParams = {
					'count?': 'number',
					'offset?': 'number',
					'sort?': 'string',
					'query?': 'string',
				};
			} else if (typeNode.typeName.escapedText === 'PaginatedResponse') {
				paginationParams = {
					count: 'number',
					offset: 'number',
					total: 'number',
				};
			}
			Object.assign(temp, paginationParams);
		}
		extractReferencedNode(typeNode, temp);
	} else if (ts.isUnionTypeNode(typeNode)) {
		const unionArr: any = [];
		temp.unionTypes = extractUnionNode(typeNode, unionArr);
	} else if (ts.isIntersectionTypeNode(typeNode)) {
		extractIntersectionNode(typeNode, temp);
	} else if (ts.isParenthesizedTypeNode(typeNode)) {
		const parenthesisType = typeNode.type;
		resolveType(parenthesisType, temp);
	}
};

const extractLiteralNode = (typeNode: ts.TypeLiteralNode, properties: any = {}) => {
	if (!typeNode) return {};

	typeNode.members?.forEach((member) => {
		if (ts.isPropertySignature(member) && member.name && ts.isIdentifier(member.name)) {
			let key = member.name.text;
			const { type } = member;
			if (member.questionToken) key += '?';
			if (!type) {
				console.error(`Type value not present at: ${key}`);
				return;
			}

			const temp: any = {};
			if (ts.isTypeReferenceNode(type)) {
				// need to make this robust: currently not working for all cases
				const subTemp: any = {};
				extractReferencedNode(type, subTemp);
				temp[key] = subTemp || 'undefined';
			} else if (ts.isTypeLiteralNode(type)) {
				const subTemp: any = {};
				extractLiteralNode(type, subTemp);
				temp[key] = subTemp;
			} else {
				const valueType = checker.getTypeAtLocation(type);
				const value = checker.typeToString(valueType);
				temp[key] = value;
			}

			Object.assign(properties, temp);
		}
	});
};

const extractUnionNode = (typeNode: ts.UnionTypeNode, unionArr: any[]) => {
	typeNode.types?.forEach((type) => {
		const unionTemp: any = {};
		resolveType(type, unionTemp);

		unionArr.push(unionTemp);
	});
	return unionArr;
};

const extractIntersectionNode = (typeNode: ts.IntersectionTypeNode, temp: any = {}) => {
	typeNode.types?.forEach((type) => {
		const subtemp = {};
		resolveType(type, subtemp);

		Object.assign(temp, subtemp);
	});
};

// const processedTypes = new Map<string, any>(); // TODO: Add cache for already processed types
const extractReferencedNode = (typeNode: ts.TypeReferenceNode, params: any = {}) => {
	if (!typeNode) return {};

	if (typeNode.typeArguments) {
		typeNode.typeArguments?.forEach((arg) => {
			resolveType(arg, params);
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
			const temp: any = {};

			if (ts.isImportSpecifier(sym) && sym.name && ts.isIdentifier(sym.name)) {
				extractImportedNode(sym, temp);
			} else if (ts.isTypeAliasDeclaration(sym) && sym.name && ts.isIdentifier(sym.name)) {
				const symbolType = sym.type;
				if (!symbolType) return {};

				resolveType(symbolType, temp);
			}
			Object.assign(params, temp);
		});
	}
};

const extractImportedNode = (typenode: ts.ImportSpecifier, params: any = {}) => {
	const importedSymbol = checker.getSymbolAtLocation(typenode.name);
	if (!importedSymbol) return typenode.getText();

	const importedAliasSymbol = checker.getAliasedSymbol(importedSymbol);
	const declarations = importedAliasSymbol.getDeclarations();

	if (!declarations) return typenode.getText();

	declarations?.forEach((sym) => {
		const temp: any = {};
		if (ts.isTypeAliasDeclaration(sym) && sym.name && ts.isIdentifier(sym.name)) {
			const symbolType = sym.type;
			if (!symbolType) return {};

			resolveType(symbolType, temp);
		}
		Object.assign(params, temp);
	});
};

const extractParameters = (method: ts.FunctionTypeNode, params: any = {}) => {
	method.parameters?.forEach((param) => {
		const paramType = param.type;
		if (!paramType) {
			console.error('Param Type Not Found!');
			return {};
		}
		const tempParam: any = {};
		resolveType(paramType, tempParam);

		Object.assign(params, tempParam);
	});
};

const extractResponses = (method: ts.FunctionTypeNode, response: any = {}) => {
	const responseType = method.type;
	if (!responseType) {
		console.error('Response Not Found');
		return {};
	}

	const tempRes: any = {};
	resolveType(responseType, tempRes);

	Object.assign(response, tempRes);
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

						const params = {};
						extractParameters(method, params);

						const response: any = {};
						extractResponses(method, response);

						endpoints[apiPath][methodName] = {
							params,
							response,
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

// console.log(JSON.stringify(endpoints));

export default endpoints;
