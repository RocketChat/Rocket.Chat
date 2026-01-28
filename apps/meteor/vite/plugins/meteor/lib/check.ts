import { visitorKeys, type Node } from 'oxc-parser';

type NodeOfType<T> = Extract<Node, { type: T }>;
type NodePredicate<T> = (node: Node | null | undefined) => node is NodeOfType<T>;

type Check = {
	[K in Node as `is${K['type']}`]: NodePredicate<K['type']>;
};

export function is<const T extends string>(node: Node | null | undefined, type: T): node is NodeOfType<T> {
	return node?.type === type;
}

export const check = Object.fromEntries(
	Object.keys(visitorKeys).map((type) => [
		`is${type}`,
		(node) => {
			return is(node, type);
		},
	]),
) as Check;
