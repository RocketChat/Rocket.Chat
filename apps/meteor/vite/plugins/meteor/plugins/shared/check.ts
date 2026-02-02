import type * as AST from '@oxc-project/types';
import { visitorKeys } from 'oxc-parser';

type NodeOfType<T> = Extract<AST.Node, { type: T }>;
type NodePredicate<T> = (node: AST.Node | null | undefined) => node is NodeOfType<T>;

type Check = {
	[K in AST.Node as `is${K['type']}`]: NodePredicate<K['type']>;
};

export const check = Object.fromEntries(Object.keys(visitorKeys).map((type) => [`is${type}`, (node) => node?.type === type])) as Check;

export function expect<T extends AST.Node['type']>(predicate: NodePredicate<T>, node: AST.Node | null | undefined): NodeOfType<T> {
	if (predicate(node)) {
		return node;
	}
	throw new Error(`Expected node of type ${predicate.name.replace(/^is/, '')}, but got ${node?.type ?? 'null or undefined'}`);
}

export function isIdentifierWithName<T extends string>(node: AST.Node, name: T): node is AST.IdentifierName & { name: T } {
	return check.isIdentifier(node) && node.name === name;
}

export function isStringLiteral(node: AST.Node): node is AST.StringLiteral {
	return check.isLiteral(node) && typeof node.value === 'string';
}
