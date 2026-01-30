/* eslint-disable complexity */
import type * as AST from '@oxc-project/types';
import { walk } from 'oxc-walker';

import { check } from './check';

/**
 * Collects exported names from Meteor package modules.
 * @param ast - The AST of the module.
 * @param names - The set to collect export names into.
 * @param pkgName - The name of the Meteor package.
 */
export function analyze(ast: AST.Program): { name: string; imports: Map<string, Set<string>>; exports: Set<string> } {
	let name = '';
	const imports = new Map<string, Set<string>>();
	const exports = new Set<string>();

	walk(ast, {
		enter(node, parent) {
			if (!check.isExpressionStatement(parent)) return;
			if (!check.isCallExpression(node)) return;
			const {
				callee,
				arguments: [pkg, func],
			} = node;

			if (
				check.isMemberExpression(callee) &&
				!callee.computed &&
				check.isMemberExpression(callee.object) &&
				callee.object.computed &&
				check.isIdentifier(callee.object.object) &&
				callee.object.object.name === 'Package' &&
				check.isLiteral(callee.object.property) &&
				callee.object.property.value === 'core-runtime' &&
				check.isIdentifier(callee.property) &&
				callee.property.name === 'queue' &&
				isLiteralString(pkg) &&
				(check.isFunctionExpression(func) || check.isArrowFunctionExpression(func))
			) {
				name = pkg.value;
				if (!check.isBlockStatement(func.body)) return;
				for (const stmt of func.body.body) {
					// Collect imports
					// var Meteor = Package.meteor.Meteor;
					// var DDP = Package['ddp-client'].DDP;
					if (check.isVariableDeclaration(stmt)) {
						for (const decl of stmt.declarations) {
							if (!check.isIdentifier(decl.id) || !check.isMemberExpression(decl.init)) {
								continue;
							}

							const { object, property } = decl.init;
							if (!check.isMemberExpression(object) || !check.isIdentifier(object.object) || object.object.name !== 'Package') {
								continue;
							}

							let pkgName: string | null = null;
							if (!object.computed && check.isIdentifier(object.property)) {
								pkgName = object.property.name;
							} else if (object.computed && isLiteralString(object.property)) {
								pkgName = object.property.value;
							}

							if (pkgName && check.isIdentifier(property)) {
								const packageImports = imports.get(pkgName);
								if (packageImports) {
									packageImports.add(property.name);
								} else {
									imports.set(pkgName, new Set([property.name]));
								}
							}
						}
					}

					if (!isReturnStatementWithObject(stmt)) continue;

					// Collect exports from the returned object
					for (const prop of stmt.argument.properties) {
						if (!isIdentifierObjectProperty(prop)) continue;
						if (prop.key.name !== 'export') continue;

						const { value } = prop;

						if (!isFunctionWithBlock(value)) continue;

						for (const stmt of value.body.body) {
							if (!isReturnStatementWithObject(stmt)) continue;
							for (const prop of stmt.argument.properties) {
								if (!isIdentifierObjectProperty(prop)) continue;
								exports.add(prop.key.name);
							}
						}
					}
				}
			}
		},
	});

	return {
		name,
		imports,
		exports,
	};
}

/**
 * Type guard to check if a node is an ObjectProperty with an IdentifierName key.
 * @param node - The AST node to check.
 * @returns True if the node is an ObjectProperty with an IdentifierName key, false otherwise.
 * @example
 * ```ts
 * { key: value }
 * ```
 */
function isIdentifierObjectProperty(node: AST.ObjectPropertyKind): node is AST.ObjectProperty & { key: AST.IdentifierName } {
	return check.isProperty(node) && !node.computed && check.isIdentifier(node.key);
}

/**
 * Type guard to check if a node is a ReturnStatement with an ObjectExpression argument.
 * @param node - The AST node to check.
 * @returns True if the node is a ReturnStatement with an ObjectExpression argument, false otherwise.
 * @example
 * ```ts
 * return { a: 1, b: 2 };
 * ```
 */
function isReturnStatementWithObject(
	node: AST.Directive | AST.Statement,
): node is AST.ReturnStatement & { argument: AST.ObjectExpression } {
	return check.isReturnStatement(node) && check.isObjectExpression(node.argument);
}

/**
 * Type guard to check if a node is a Function with a BlockStatement body.
 * @param node - The AST node to check.
 * @returns True if the node is a Function with a BlockStatement body, false otherwise.
 * @example
 * ```ts
 * function() { ... }
 * ```
 */
function isFunctionWithBlock(node: AST.Expression): node is AST.Function & { body: AST.BlockStatement } {
	return check.isFunctionExpression(node) && check.isBlockStatement(node.body);
}

/**
 * Type guard to check if a node is a StringLiteral.
 * @param node - The AST node to check.
 * @returns True if the node is a StringLiteral, false otherwise.
 * @example
 * ```ts
 * "string value"
 * ```
 */
function isLiteralString(node: AST.Node): node is AST.StringLiteral {
	return check.isLiteral(node) && typeof node.value === 'string';
}
