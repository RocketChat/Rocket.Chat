import type { ObjectExpression, Program, PropertyKey } from 'oxc-parser';
import { walk } from 'oxc-walker';

import { check } from './check';

/**
 * Collects exported names from Meteor package modules.
 * @param ast - The AST of the module.
 * @param names - The set to collect export names into.
 * @param pkgName - The name of the Meteor package.
 * 
 * @example
{
      "type": "ExpressionStatement",
      "expression": {
        "type": "CallExpression",
        "callee": {
          "type": "MemberExpression",
          "object": {
            "type": "MemberExpression",
            "object": {
              "type": "Identifier",
              "name": "Package",
            },
            "property": {
              "type": "Literal",
              "value": "core-runtime",
              "raw": "\"core-runtime\"",
            },
            "optional": false,
            "computed": true,
          },
          "property": {
            "type": "Identifier",
            "name": "queue",
          },
          "optional": false,
          "computed": false,
        },
        "arguments": [
          {
            "type": "Literal",
            "value": "oauth",
            "raw": "\"oauth\"",
          },
          {
            "type": "FunctionExpression",
            "id": null,
            "generator": false,
            "async": false,
            "params": [],
            "body": {
              "type": "BlockStatement",
              "body": [
                {
                  "type": "ReturnStatement",
                  "argument": {
                    "type": "ObjectExpression",
                    "properties": [
                      {
                        "type": "Property",
                        "kind": "init",
                        "key": {
                          "type": "Identifier",
                          "name": "export",
                        },
                        "value": {
                          "type": "FunctionExpression",
                          "id": null,
                          "generator": false,
                          "async": false,
                          "params": [],
                          "body": {
                            "type": "BlockStatement",
                            "body": [
                              {
                                "type": "ReturnStatement",
                                "argument": {
                                  "type": "ObjectExpression",
                                  "properties": [
                                    {
                                      "type": "Property",
                                      "kind": "init",
                                      "key": {
                                        "type": "Identifier",
                                        "name": "OAuth",
                                      },
                                      "value": {
                                        "type": "Identifier",
                                        "name": "OAuth",
                                      },
                                      "method": false,
                                      "shorthand": false,
                                      "computed": false,
                                    }
                                  ],
                                },
                              }
                            ],
                          },
                          "expression": false,
                        },
                        "method": false,
                        "shorthand": false,
                        "computed": false,
                      }
                    ],
                  },
                }
              ],
            },
            "expression": false,
          }
        ],
        "optional": false,
      },
    }
 */
export function collectModuleExports(ast: Program, names: Set<string>, pkgName: string): void {
	// Traverse the AST
	walk(ast, {
		enter(node, parent) {
			if (!check.isExpressionStatement(parent)) return;
			if (!check.isCallExpression(node)) return;
			const { callee, arguments: args } = node;
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
				args.length === 2 &&
				check.isLiteral(args[0]) &&
				args[0].value === pkgName &&
				(check.isFunctionExpression(args[1]) || check.isArrowFunctionExpression(args[1]))
			) {
				const func = args[1];
				if (!check.isBlockStatement(func.body)) return;
				for (const stmt of func.body.body) {
					if (!check.isReturnStatement(stmt)) continue;
					if (!check.isObjectExpression(stmt.argument)) continue;
					// Collect exports from the returned object
					for (const prop of stmt.argument.properties) {
						if (!check.isProperty(prop)) continue;
						if (!check.isIdentifier(prop.key)) continue;
						if (prop.key.name !== 'export') continue;

						const { value } = prop;

						if (!check.isFunctionExpression(value)) continue;
						if (!check.isBlockStatement(value.body)) continue;

						for (const stmt of value.body.body) {
							if (!check.isReturnStatement(stmt)) continue;
							if (!check.isObjectExpression(stmt.argument)) continue;

							collectExportsFromObjectExpression(stmt.argument, names);
						}
					}
				}
			}
		},
	});
}

const collectExportsFromObjectExpression = (argument: ObjectExpression, names: Set<string>): void => {
	for (const prop of argument.properties) {
		if (!check.isProperty(prop)) continue;
		if (prop.computed) continue;
		if (!check.isIdentifier(prop.key)) continue;

		const keyName = getPropertyName(prop.key);

		if (keyName === 'export') {
			const { value } = prop;
			if (check.isFunctionExpression(value) || check.isArrowFunctionExpression(value)) {
				if (check.isBlockStatement(value.body)) {
					for (const stmt of value.body.body) {
						if (check.isReturnStatement(stmt) && check.isObjectExpression(stmt.argument)) {
							collectExportsFromObjectExpression(stmt.argument, names);
						}
					}
				}
			}
			continue;
		}

		if (keyName && keyName !== 'require' && keyName !== 'eagerModulePaths') {
			names.add(keyName);
		}
	}
};
function getPropertyName(key: PropertyKey) {
	if (check.isIdentifier(key)) {
		return key.name;
	}

	if (check.isLiteral(key) && typeof key.value === 'string') {
		return key.value;
	}
}
