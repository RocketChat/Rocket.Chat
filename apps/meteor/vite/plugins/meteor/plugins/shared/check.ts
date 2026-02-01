import { visitorKeys, type Node } from 'oxc-parser';

type NodeOfType<T> = Extract<Node, { type: T }>;
type NodePredicate<T> = (node: Node | null | undefined) => node is NodeOfType<T>;

type Check = {
	[K in Node as `is${K['type']}`]: NodePredicate<K['type']>;
};

export const check = Object.fromEntries(Object.keys(visitorKeys).map((type) => [`is${type}`, (node) => node?.type === type])) as Check;

export function expect<T extends Node['type']>(predicate: NodePredicate<T>, node: Node | null | undefined): NodeOfType<T> {
	if (predicate(node)) {
		return node;
	}
	throw new Error(`Expected node of type ${predicate.name.replace(/^is/, '')}, but got ${node?.type ?? 'null or undefined'}`);
}
