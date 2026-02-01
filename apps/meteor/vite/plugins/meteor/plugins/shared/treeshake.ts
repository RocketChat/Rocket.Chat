import * as AST from '@oxc-project/types';
import { walk } from 'oxc-walker';

import { check } from './check';

const packages = [
	'react',
	'react-dom',
	'@babel/runtime',
	'scheduler',
	'react/jsx-runtime',
	'react/jsx-dev-runtime',
	'react-dom/client',
	'react-dom/server',
	'react-dom/test-utils',
	'localforage',
	'typia',
	'ajv',
	'swiper',
	'zustand',
	'codemirror',
	'@rocket.chat/emitter',
	'@rocket.chat/fuselage',
	'@rocket.chat/fuselage-hooks',
	'@rocket.chat/icons',
	'@rocket.chat/i18n',
	'@rocket.chat/livechat-ui-contexts',
	'@rocket.chat/livechat-ui-client',
	'@rocket.chat/qrcode',
	'@rocket.chat/theme',
	'@rocket.chat/gazzodown',
	'@rocket.chat/core-typings',
	'@rocket.chat/css-in-js',
	'@rocket.chat/mongo-adapter',
	'@rocket.chat/api-client',
	'@rocket.chat/ui-client',
	'@rocket.chat/stylis-logical-props-middleware',
	'@rocket.chat/ui-contexts',
	'@rocket.chat/fuselage-tokens',
	'@rocket.chat/password-policies',
	'@rocket.chat/sha256',
	'@rocket.chat/random',
	'@rocket.chat/tools',
	'@rocket.chat/ui-avatar',
	'@tanstack/react-query',
	'@tanstack/query-core',
	'date-fns',
	'i18next',
	'react-error-boundary',
	'react-i18next',
	'query-string',
	'moment',
	'zod',
	'underscore',
	'moment-timezone',
	'react-hook-form',
	'react-virtuoso',
	'react-aria',
	'react-stately',
	'sanitize-html',
	'dompurify',
	'@react-aria',
	'@react-stately',
	'@internationalized',
	'@formatjs',
	'intl-messageformat',
	'i18next-sprintf-postprocessor',
	'overlayscrollbars-react',
	'overlayscrollbars',
	'stylis',
];

export function treeshake(ast: AST.Program): AST.Program {
	const extraImports: AST.ImportDeclaration[] = [];

	walk(ast, {
		enter(node) {
			if (
				check.isCallExpression(node) &&
				check.isIdentifier(node.callee) &&
				node.callee.name === 'meteorInstall' &&
				node.arguments.length > 0 &&
				check.isObjectExpression(node.arguments[0])
			) {
				const rootObj = node.arguments[0];
				for (const prop of rootObj.properties) {
					if (
						check.isProperty(prop) &&
						check.isLiteral(prop.key) &&
						prop.key.value === 'node_modules' &&
						check.isObjectExpression(prop.value)
					) {
						processNodeModules(prop.value, '', packages, extraImports);
					}
				}
			}
		},
	});

	if (extraImports.length > 0) {
		ast.body.unshift(...extraImports);
	}

	return ast;
}

function processNodeModules(
	node: AST.ObjectExpression,
	currentPath: string,
	packages: string[],
	imports: AST.ImportDeclaration[],
): boolean {
	let found = false;
	for (const prop of node.properties) {
		if (!check.isProperty(prop) || !check.isLiteral(prop.key) || typeof prop.key.value !== 'string') {
			continue;
		}
		const key = prop.key.value;
		const fullPath = currentPath ? `${currentPath}/${key}` : key;

		// Check if this path matches one of our target packages
		const pkg = packages.find((p) => fullPath === p || fullPath.startsWith(`${p}/`));

		if (pkg) {
			if (check.isFunctionExpression(prop.value)) {
				if (fullPath.endsWith('package.json')) {
					found = true;
					continue;
				}
				const importPath = resolveImportPath(fullPath);
				const varName = `__dedup_${fullPath.replace(/[^a-zA-Z0-9]/g, '_')}`;

				// Create import declaration: import * as varName from 'importPath';
				imports.push({
					type: 'ImportDeclaration',
					specifiers: [
						{
							type: 'ImportNamespaceSpecifier',
							local: { type: 'Identifier', name: varName, start: 0, end: 0 },
							start: 0,
							end: 0,
						},
					],
					phase: null,
					attributes: [],
					source: { type: 'Literal', value: importPath, raw: `'${importPath}'`, start: 0, end: 0 },
					start: 0,
					end: 0,
				});

				// Replace function body with stub
				// module.exports = varName; OR module.exports = varName.default || varName;
				const assignmentRight: AST.Expression =
					fullPath.includes('@babel/runtime') || fullPath.includes('react/')
						? {
								type: 'LogicalExpression',
								operator: '||',
								left: {
									type: 'MemberExpression',
									object: { type: 'Identifier', name: varName, start: 0, end: 0 },
									property: { type: 'Identifier', name: 'default', start: 0, end: 0 },
									computed: false,
									optional: false,
									start: 0,
									end: 0,
								},
								right: { type: 'Identifier', name: varName, start: 0, end: 0 },
								start: 0,
								end: 0,
							}
						: { type: 'Identifier', name: varName, start: 0, end: 0 };

				// m.exports = ...
				const assignment: AST.ExpressionStatement = {
					type: 'ExpressionStatement',
					expression: {
						type: 'AssignmentExpression',
						operator: '=',
						left: {
							type: 'MemberExpression',
							object: { type: 'Identifier', name: 'module', start: 0, end: 0 }, // 'm' is the 3rd arg in meteorInstall closure
							property: { type: 'Identifier', name: 'exports', start: 0, end: 0 },
							computed: false,
							optional: false,
							start: 0,
							end: 0,
						},
						right: assignmentRight,
						start: 0,
						end: 0,
					},
					start: 0,
					end: 0,
				};

				prop.value.body = {
					type: 'BlockStatement',
					body: [assignment],
					start: 0,
					end: 0,
				};

				found = true;
			} else if (check.isObjectExpression(prop.value)) {
				if (processNodeModules(prop.value, fullPath, packages, imports)) {
					found = true;
				}
			}
		} else {
			if (check.isObjectExpression(prop.value)) {
				// Continue traversing even if the current path doesn't match a target package
				// This handles cases like 'some-package/node_modules/react' where 'some-package' isn't in our list
				if (processNodeModules(prop.value, fullPath, packages, imports)) {
					found = true;
				}
			} else if (check.isFunctionExpression(prop.value)) {
				const size = prop.value.end - prop.value.start;
				const isRed = size > 2500;
				if (isRed) {
					console.warn(`Skipping non-matching package path: ${fullPath} - Size: ${size} bytes`);
				}
			}
		}
	}
	return found;
}

function resolveImportPath(path: string) {
	let res = path.replace(/\.(js|cjs|mjs)$/, '');

	if (res.includes('/node_modules/')) {
		res = res.split('/node_modules/').pop()!;
	}

	if (res.startsWith('react/')) {
		if (res === 'react/index' || res.includes('/react.production') || res.includes('/react.development')) {
			return 'react';
		}
		if (res.includes('/react-jsx-runtime') || res === 'react/jsx-runtime') {
			return 'react/jsx-runtime';
		}
		if (res.includes('/react-jsx-dev-runtime') || res === 'react/jsx-dev-runtime') {
			return 'react/jsx-dev-runtime';
		}
	}

	if (res.startsWith('react-dom/')) {
		if (res === 'react-dom/index' || res.includes('/react-dom.production') || res.includes('/react-dom.development')) {
			return 'react-dom';
		}
		if (res.includes('/react-dom-client') || res === 'react-dom/client') {
			return 'react-dom/client';
		}
		if (res.includes('/react-dom-server') || res === 'react-dom/server') {
			return 'react-dom/server';
		}
		if (res.includes('/react-dom-test-utils') || res === 'react-dom/test-utils') {
			return 'react-dom/test-utils';
		}
	}

	if (res.startsWith('zod/')) {
		if (res.startsWith('zod/v4') || res === 'zod/v4') {
			if (res.startsWith('zod/v4/locales') || res === 'zod/v4/locales') {
				return 'zod/v4/locales';
			}
			return 'zod/v4';
		}
		if (res.startsWith('zod/locales') || res === 'zod/locales') {
			return 'zod/locales';
		}
		return 'zod';
	}

	if (res.startsWith('react-aria/')) {
		if (res.startsWith('react-aria/i18n')) {
			return res;
		}
		return 'react-aria';
	}

	// if (packages.find((p) => res === p || res.startsWith(`${p}/`))) {
	// 	return res;
	// }

	if (res.startsWith('react-stately')) {
		return 'react-stately';
	}
	if (res.startsWith('react-hook-form')) {
		return 'react-hook-form';
	}

	if (res.startsWith('@react-aria/')) {
		return res.split('/').slice(0, 2).join('/');
	}
	if (res.startsWith('@react-stately/')) {
		return res.split('/').slice(0, 2).join('/');
	}
	if (res.startsWith('@internationalized/')) {
		return res.split('/').slice(0, 2).join('/');
	}
	if (res.startsWith('@formatjs/')) {
		return res.split('/').slice(0, 2).join('/');
	}
	if (res.startsWith('intl-messageformat')) {
		return 'intl-messageformat';
	}

	if (res.startsWith('stylis')) {
		return 'stylis';
	}

	if (res.startsWith('overlayscrollbars')) {
		return 'overlayscrollbars';
	}

	if (res.startsWith('overlayscrollbars-react')) {
		return 'overlayscrollbars-react';
	}
	if (res.startsWith('i18next-sprintf-postprocessor')) {
		return 'i18next-sprintf-postprocessor';
	}
	if (res.startsWith('@rocket.chat/core-typings')) {
		return '@rocket.chat/core-typings';
	}
	if (res.startsWith('@rocket.chat/mongo-adapter')) {
		return '@rocket.chat/mongo-adapter';
	}

	if (res.startsWith('@rocket.chat/tools')) {
		return '@rocket.chat/tools';
	}

	if (res.startsWith('@rocket.chat/ui-client')) {
		return '@rocket.chat/ui-client';
	}

	if (res.startsWith('@rocket.chat/ui-avatar')) {
		return '@rocket.chat/ui-avatar';
	}

	if (res.startsWith('@rocket.chat/ui-contexts')) {
		return '@rocket.chat/ui-contexts';
	}

	if (res.startsWith('@rocket.chat/api-client')) {
		return '@rocket.chat/api-client';
	}

	if (res.startsWith('@rocket.chat/password-policies')) {
		return '@rocket.chat/password-policies';
	}

	if (res.startsWith('@rocket.chat/sha256')) {
		return '@rocket.chat/sha256';
	}

	if (res.startsWith('@rocket.chat/random')) {
		return '@rocket.chat/random';
	}

	if (res.startsWith('underscore')) {
		return 'underscore';
	}
	if (res.startsWith('dompurify')) {
		return 'dompurify';
	}
	if (res.startsWith('sanitize-html')) {
		return 'sanitize-html';
	}

	// Helper to strip standard suffix patterns
	// e.g. @rocket.chat/i18n/dist/index -> @rocket.chat/i18n
	if (res.endsWith('/dist/index')) {
		return res.replace(/\/dist\/index$/, '');
	}
	if (res.endsWith('/dist/index.common')) {
		return res.replace(/\/dist\/index\.common$/, '');
	}
	if (res.includes('/dist/es/')) {
		return res.replace(/\/dist\/es\/.*$/, '');
	}
	if (res.includes('/build/legacy/')) {
		return res.replace(/\/build\/legacy\/.*$/, '');
	}
	if (res.includes('/dist/esm/')) {
		return res.replace(/\/dist\/esm\/.*$/, '');
	}

	// e.g. some-lib/index -> some-lib
	return res.replace(/\/index$/, '');
}
