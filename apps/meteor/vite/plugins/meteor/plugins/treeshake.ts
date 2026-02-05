import type * as AST from '@oxc-project/types';
import { prefixRegex } from '@rolldown/pluginutils';
import { walk } from 'oxc-walker';
import type { PluginOption } from 'vite';

import * as b from './shared/builders';
import { check } from './shared/check';
import type { ResolvedPluginOptions } from './shared/config';
import { printCode } from './shared/print';

function treeshakeMeteorInstall(ast: AST.Program): AST.Program {
	walk(ast, {
		enter(node, parent) {
			if (check.isProperty(parent) && check.isLiteral(parent.key) && parent.key.value === 'node_modules') {
				if (check.isObjectExpression(node)) {
					this.replace(
						b.objectExpression(
							node.properties.filter((prop) => {
								if (check.isProperty(prop) && check.isLiteral(prop.key) && typeof prop.key.value === 'string') {
									return ['meteor', '@meteorjs', '@babel'].includes(prop.key.value);
								}
								return false;
							}),
						),
					);
				}
			}
		},
	});

	return ast;
}

function isModuleLinkCall(node: AST.Node, name: string): boolean {
	return (
		check.isExpressionStatement(node) &&
		check.isCallExpression(node.expression) &&
		check.isMemberExpression(node.expression.callee) &&
		check.isIdentifier(node.expression.callee.object) &&
		node.expression.callee.object.name === 'module' &&
		check.isIdentifier(node.expression.callee.property) &&
		node.expression.callee.property.name === 'link' &&
		check.isLiteral(node.expression.arguments[0]) &&
		node.expression.arguments[0].value === name
	);
}

function treeshakeSockJs(ast: AST.Program): AST.Program {
	walk(ast, {
		enter(node) {
			if (check.isProperty(node) && check.isLiteral(node.key) && node.key.value === 'sockjs-1.6.1-min-.js') {
				this.remove();
				return;
			}

			if (isModuleLinkCall(node, './sockjs-1.6.1-min-.js')) {
				this.remove();
			}
		},
	});

	return ast;
}

export function treeshake(resolvedConfig: ResolvedPluginOptions): PluginOption {
	let totalOriginalSize = 0;
	let totalFinalSize = 0;
	return {
		name: 'meteor:treeshake',
		apply: resolvedConfig.treeshake ? undefined : 'build',
		transform: {
			filter: {
				id: prefixRegex(`${resolvedConfig.programsDir}/web.browser/packages/`),
			},
			handler(code, id) {
				const name = id.replace(`${resolvedConfig.programsDir}/web.browser/packages/`, '');
				const startLength = code.length;
				totalOriginalSize += startLength;
				const ast = this.parse(code, { astType: 'js', lang: 'js', preserveParens: false });
				treeshakeMeteorInstall(ast);
				if (name === 'socket-stream-client.js' && resolvedConfig.disableSockJS) {
					treeshakeSockJs(ast);
				}
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
