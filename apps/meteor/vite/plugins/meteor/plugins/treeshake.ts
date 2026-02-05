import type * as AST from '@oxc-project/types';
import { prefixRegex } from '@rolldown/pluginutils';
import { walk, type WalkerThisContextEnter } from 'oxc-walker';
import type { PluginOption } from 'vite';

import * as b from './shared/builders';
import { check } from './shared/check';
import type { ResolvedPluginOptions } from './shared/config';
import { printCode } from './shared/print';

const packages = [
	'@babel',
	'@emotion',
	'@formatjs',
	'@internationalized',
	'@react-aria',
	'@react-stately',
	'@rocket.chat',
	'@swc',
	'@tanstack',
	'ajv',
	'clsx',
	'codemirror',
	'date-fns',
	'decode-uri-component',
	'dompurify',
	'filter-obj',
	'html-parse-stringify',
	'i18next-sprintf-postprocessor',
	'i18next',
	'intl-messageformat',
	'invariant',
	'localforage',
	'moment-timezone',
	'moment',
	'overlayscrollbars-react',
	'overlayscrollbars',
	'query-string',
	're-resizable',
	'react-aria',
	'react-dom',
	'react-dom/client',
	'react-dom/server',
	'react-dom/test-utils',
	'react-error-boundary',
	'react-hook-form',
	'react-i18next',
	'react-stately',
	'react-virtuoso',
	'react',
	'react/jsx-dev-runtime',
	'react/jsx-runtime',
	'sanitize-html',
	'scheduler',
	'split-on-first',
	'strict-uri-encode',
	'stylis',
	'swiper',
	'typia',
	'underscore',
	'void-elements',
	'zod',
	'zustand',
	'meteor/socket-stream-client/sockjs-1.6.1-min-.js',
];

function treeshakeMeteorModules(ast: AST.Program): AST.Program {
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
						processNodeModules(this, prop.value, '', packages, extraImports);
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
	ctx: WalkerThisContextEnter,
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
				if (!importPath.startsWith('meteor/')) {
					imports.push(b.importDeclaration([b.importNamespaceSpecifier(b.identifier(varName))], b.stringLiteral(importPath)));

					// Replace function body with stub
					// module.exports = varName; OR module.exports = varName.default || varName;
					// m.exports = ...
					prop.value.body = b.blockStatement([
						b.expressionStatement(
							b.assignmentExpression(
								'=',
								b.memberExpression(b.identifier('module'), b.identifier('exports')),
								fullPath.includes('@babel/runtime') || fullPath.includes('react/')
									? b.logicalExpression(b.memberExpression(b.identifier(varName), b.identifier('default')), '||', b.identifier(varName))
									: b.identifier(varName),
							),
						),
					]);
				} else {
					prop.value.body = b.blockStatement([]);
				}

				found = true;
			} else if (check.isObjectExpression(prop.value)) {
				if (processNodeModules(ctx, prop.value, fullPath, packages, imports)) {
					found = true;
				}
			}
		} else if (check.isObjectExpression(prop.value)) {
			// Continue traversing even if the current path doesn't match a target package
			// This handles cases like 'some-package/node_modules/react' where 'some-package' isn't in our list
			if (processNodeModules(ctx, prop.value, fullPath, packages, imports)) {
				found = true;
			}
		}
	}
	return found;
}

function resolveImportPath(path: string) {
	let res = path.replace(/\.(js|cjs|mjs)$/, '');

	const poppedNodeModules = res.split('/node_modules/').pop();
	if (poppedNodeModules) {
		res = poppedNodeModules;
	}

	const directPackages = [
		'clsx',
		'@meteorjs/reify',
		'@emotion/hash',
		'react-stately',
		'react-hook-form',
		'stylis',
		'invariant',
		'overlayscrollbars',
		'overlayscrollbars-react',
		'i18next-sprintf-postprocessor',
		'intl-messageformat',
		'underscore',
		'dompurify',
		'sanitize-html',
		'@rocket.chat/core-typings',
		'@rocket.chat/mongo-adapter',
		'@rocket.chat/tools',
		'@rocket.chat/ui-client',
		'@rocket.chat/ui-avatar',
		'@rocket.chat/ui-contexts',
		'@rocket.chat/api-client',
		'@rocket.chat/password-policies',
		'@rocket.chat/sha256',
		'@rocket.chat/random',
	];

	for (const pkg of directPackages) {
		if (res.startsWith(pkg)) {
			return pkg;
		}
	}

	const scopedPrefixes = ['@react-aria/', '@react-stately/', '@internationalized/', '@formatjs/'];
	for (const prefix of scopedPrefixes) {
		if (res.startsWith(prefix)) {
			return res.split('/').slice(0, 2).join('/');
		}
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
		if (res.startsWith('zod/v4')) {
			if (res.startsWith('zod/v4/locales')) {
				return 'zod/v4/locales';
			}
			return 'zod/v4';
		}
		if (res.startsWith('zod/locales')) {
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

	// Helper to strip standard suffix patterns
	return res
		.replace(/\/dist\/index$/, '')
		.replace(/\/dist\/index\.common$/, '')
		.replace(/\/dist\/es\/.*$/, '')
		.replace(/\/build\/legacy\/.*$/, '')
		.replace(/\/dist\/esm\/.*$/, '')
		.replace(/\/index$/, '');
}

export function treeshake(resolvedConfig: ResolvedPluginOptions): PluginOption {
	let totalOriginalSize = 0;
	let totalFinalSize = 0;
	return {
		name: 'meteor:treeshake',
		apply: 'build',
		transform: {
			filter: {
				id: prefixRegex(`${resolvedConfig.programsDir}/web.browser/packages/`),
			},
			handler(code, id) {
				const name = id.replace(`${resolvedConfig.programsDir}/web.browser/packages/`, '');
				const startLength = code.length;
				totalOriginalSize += startLength;
				const ast = this.parse(code, { astType: 'js', lang: 'js', preserveParens: false });
				treeshakeMeteorModules(ast);
				const transformedCode = printCode(ast);
				const endLength = transformedCode.length;

				const percentRemoved = (((startLength - endLength) / startLength) * 100).toFixed(2);
				const bytesRemoved = startLength - endLength;
				this.info(`${name}: ${startLength} -> ${endLength} (diff: ${bytesRemoved} bytes, ${percentRemoved}%)`);
				if (endLength > startLength) {
					this.warn(`${name} increased in size after treeshaking!`);
					totalFinalSize += startLength;
					return code;
				}
				totalFinalSize += endLength;
				return transformedCode;
			},
		},
		buildEnd: {
			handler() {
				const totalBytesRemoved = totalOriginalSize - totalFinalSize;
				const totalPercentRemoved = ((totalBytesRemoved / totalOriginalSize) * 100).toFixed(2);
				this.info(
					`Total size reduction: ${totalOriginalSize} -> ${totalFinalSize} (diff: ${totalBytesRemoved} bytes, ${totalPercentRemoved}%)`,
				);
			},
		},
	};
}
