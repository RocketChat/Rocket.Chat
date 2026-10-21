import { isRecord } from '@rocket.chat/tools';

const MAX_LINEAR_SCALE_POINTS = 100;
const MAX_NESTING_DEPTH = 10;

const assertValidLinearScale = (element: Record<string, unknown>, path: string): void => {
	const { minValue = 0, maxValue = 10 } = element;

	if (!Number.isInteger(minValue) || !Number.isInteger(maxValue)) {
		throw new Error(`Invalid blocks: ${path} must have integer minValue and maxValue`);
	}

	if ((maxValue as number) - (minValue as number) + 1 > MAX_LINEAR_SCALE_POINTS) {
		throw new Error(`Invalid blocks: ${path} cannot have more than ${MAX_LINEAR_SCALE_POINTS} points`);
	}
};

const assertValidNode = (node: unknown, path: string, depth: number): void => {
	if (depth > MAX_NESTING_DEPTH) {
		throw new Error(`Invalid blocks: ${path} is nested too deeply`);
	}

	if (Array.isArray(node)) {
		node.forEach((child, index) => assertValidNode(child, `${path}[${index}]`, depth + 1));
		return;
	}

	if (!isRecord(node)) {
		return;
	}

	if (node.type === 'linear_scale') {
		assertValidLinearScale(node, path);
	}

	Object.entries(node).forEach(([key, child]) => assertValidNode(child, `${path}.${key}`, depth + 1));
};

/** Rejects blocks that the message renderer cannot walk, so a sent message never makes its room unreadable. */
export function assertValidMessageBlocks(blocks: unknown): void {
	if (!Array.isArray(blocks)) {
		return;
	}

	blocks.forEach((block, index) => assertValidNode(block, `blocks[${index}]`, 0));
}
