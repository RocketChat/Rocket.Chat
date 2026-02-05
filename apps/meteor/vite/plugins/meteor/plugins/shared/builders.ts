import type * as AST from '@oxc-project/types';

export function identifier(name: AST.IdentifierName['name']): AST.IdentifierName {
	return {
		type: 'Identifier',
		name,
		start: 0,
		end: 0,
	};
}

export function booleanLiteral(value: AST.BooleanLiteral['value']): AST.BooleanLiteral {
	return {
		type: 'Literal',
		value,
		raw: value ? 'true' : 'false',
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
	phase: AST.ImportDeclaration['phase'] = null,
	attributes: AST.ImportDeclaration['attributes'] = [],
	importKind: AST.ImportDeclaration['importKind'] = 'value',
): AST.ImportDeclaration {
	return {
		type: 'ImportDeclaration',
		specifiers,
		source,
		phase,
		attributes,
		importKind,
		start: 0,
		end: 0,
	};
}

export function memberExpression(object: AST.MemberExpression['object'], property: AST.MemberExpression['property']): AST.MemberExpression {
	switch (property.type) {
		case 'PrivateIdentifier':
			return {
				type: 'MemberExpression',
				object,
				property,
				computed: false,
				optional: false,
				start: 0,
				end: 0,
			};
		case 'Identifier':
			return {
				type: 'MemberExpression',
				object,
				property,
				computed: false,
				optional: false,
				start: 0,
				end: 0,
			};
		default:
			return {
				type: 'MemberExpression',
				object,
				property,
				computed: true,
				optional: false,
				start: 0,
				end: 0,
			};
	}
}

export function assignmentExpression(
	operator: AST.AssignmentExpression['operator'],
	left: AST.AssignmentExpression['left'],
	right: AST.AssignmentExpression['right'],
): AST.AssignmentExpression {
	return {
		type: 'AssignmentExpression',
		operator,
		left,
		right,
		start: 0,
		end: 0,
	};
}

export function logicalExpression(
	left: AST.LogicalExpression['left'],
	operator: AST.LogicalExpression['operator'],
	right: AST.LogicalExpression['right'],
): AST.LogicalExpression {
	return {
		type: 'LogicalExpression',
		left,
		operator,
		right,
		start: 0,
		end: 0,
	};
}

export function expressionStatement(
	expression: AST.ExpressionStatement['expression'],
	directive: AST.ExpressionStatement['directive'] = null,
): AST.ExpressionStatement {
	return {
		type: 'ExpressionStatement',
		expression,
		directive,
		start: 0,
		end: 0,
	};
}

export function blockStatement(body: AST.BlockStatement['body']): AST.BlockStatement {
	return {
		type: 'BlockStatement',
		body,
		start: 0,
		end: 0,
	};
}
