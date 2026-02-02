/* eslint-disable complexity */
import type * as AST from '@oxc-project/types';
import { walk } from 'oxc-walker';

import { expect, check, isIdentifierWithName, isStringLiteral } from './check';

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
				isNonComputedMemberExpression(callee) &&
				isComputedMemberExpression(callee.object) &&
				isIdentifierWithName(callee.object.object, 'Package') &&
				isLiteralWithValue(callee.object.property, 'core-runtime') &&
				isIdentifierWithName(callee.property, 'queue') &&
				isStringLiteral(pkg) &&
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

							const pkgName = extractPackageName(object);

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

function extractPackageName(object: AST.MemberExpression): string {
	if (check.isLiteral(object.property)) {
		if (typeof object.property.value === 'string') {
			return object.property.value;
		}
		throw new Error('Unexpected non-string package name literal');
	}

	return expect(check.isIdentifier, object.property).name;
}

function isComputedMemberExpression(node: AST.Expression): node is Extract<AST.MemberExpression, { computed: true }> {
	return check.isMemberExpression(node) && node.computed;
}

function isNonComputedMemberExpression(node: AST.Expression): node is Extract<AST.MemberExpression, { computed: false }> {
	return check.isMemberExpression(node) && !node.computed;
}

type Primitive = string | number | bigint | boolean | RegExp | null;

type ToPrimitive<T> = T extends string
	? string
	: T extends number
		? number
		: T extends bigint
			? bigint
			: T extends boolean
				? boolean
				: T extends RegExp
					? RegExp
					: T extends null
						? null
						: T;
function isLiteralWithValue<T extends Primitive>(
	node: AST.Expression,
	value: T,
): node is Extract<AST.Expression, { type: 'Literal'; value: ToPrimitive<T> }> {
	return check.isLiteral(node) && node.value === value;
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
