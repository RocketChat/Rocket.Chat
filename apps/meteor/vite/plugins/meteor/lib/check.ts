import { visitorKeys, type Node } from "oxc-parser";

type Check = {
	[K in Node as `is${K['type']}`]: (node: Node | null | undefined) => node is Extract<Node, { type: K['type'] }>;
};

export function is<const T extends string>(node: Node | null | undefined, type: T): node is Extract<Node, { type: T }> {
	return node?.type === type;
}

export const check: Check = Object.fromEntries(
	Object.keys(visitorKeys).map((type) => [
		`is${type}`,
		(node: Node | null | undefined): node is Extract<Node, { type: typeof type }> => {
			return is(node, type);
		},
	]),
) as any;