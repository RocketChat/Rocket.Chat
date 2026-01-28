import type {
	Directive,
	IdentifierName,
	ObjectExpression,
	ObjectProperty,
	ObjectPropertyKind,
	Program,
	ReturnStatement,
	Statement,
} from 'oxc-parser';
import { walk } from 'oxc-walker';

import { check } from './check';

/**
 * Collects exported names from Meteor package modules.
 * @param ast - The AST of the module.
 * @param names - The set to collect export names into.
 * @param pkgName - The name of the Meteor package.
 */
export function collectModuleExports(ast: Program, pkgName: string): Set<string> {
	const names = new Set<string>();

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
				check.isLiteral(pkg) &&
				pkg.value === pkgName &&
				(check.isFunctionExpression(func) || check.isArrowFunctionExpression(func))
			) {
				if (!check.isBlockStatement(func.body)) return;
				for (const stmt of func.body.body) {
					if (!isReturnStatementWithObject(stmt)) continue;

					// Collect exports from the returned object
					for (const prop of stmt.argument.properties) {
						if (!isIdentifierObjectProperty(prop)) continue;
						if (prop.key.name !== 'export') continue;

						const { value } = prop;

						if (!check.isFunctionExpression(value)) continue;
						if (!check.isBlockStatement(value.body)) continue;

						for (const stmt of value.body.body) {
							if (!isReturnStatementWithObject(stmt)) continue;
							for (const prop of stmt.argument.properties) {
								if (!isIdentifierObjectProperty(prop)) continue;
								names.add(prop.key.name);
							}
						}
					}
				}
			}
		},
	});

	return names;
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
function isIdentifierObjectProperty(node: ObjectPropertyKind): node is ObjectProperty & { key: IdentifierName } {
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
function isReturnStatementWithObject(node: Directive | Statement): node is ReturnStatement & { argument: ObjectExpression } {
	return check.isReturnStatement(node) && check.isObjectExpression(node.argument);
}
