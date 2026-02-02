import type * as AST from '@oxc-project/types';

export function identifier(name: AST.IdentifierReference['name']): AST.IdentifierReference {
	return {
		type: 'Identifier',
		name,
		start: 0,
		end: 0,
	};
}

export function stringLiteral(value: AST.StringLiteral['value']): AST.StringLiteral {
	return {
		type: 'Literal',
		value,
		raw: `'${value}'`,
		start: 0,
		end: 0,
	};
}

export function importNamespaceSpecifier(local: AST.ImportNamespaceSpecifier['local']): AST.ImportNamespaceSpecifier {
	return {
		type: 'ImportNamespaceSpecifier',
		local,
		start: 0,
		end: 0,
	};
}

export function importDeclaration(
	specifiers: AST.ImportDeclaration['specifiers'],
	source: AST.ImportDeclaration['source'],
): AST.ImportDeclaration {
	return {
		type: 'ImportDeclaration',
		specifiers,
		phase: null,
		attributes: [],
		source,
		start: 0,
		end: 0,
	};
}
