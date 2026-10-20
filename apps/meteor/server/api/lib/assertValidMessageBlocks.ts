const MAX_LINEAR_SCALE_POINTS = 100;
const MAX_NESTING_DEPTH = 10;

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);

const assertArrayOfRecords = (value: unknown, path: string): void => {
	if (!Array.isArray(value) || !value.every(isRecord)) {
		throw new Error(`Invalid blocks: ${path} must be an array of objects`);
	}
};

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
	if (blocks === undefined || blocks === null) {
		return;
	}

	assertArrayOfRecords(blocks, 'blocks');

	(blocks as Record<string, unknown>[]).forEach((block, index) => {
		const path = `blocks[${index}]`;

		if (block.type === 'actions' || block.type === 'context') {
			assertArrayOfRecords(block.elements, `${path}.elements`);
		}

		if (block.type === 'section' && block.fields !== undefined) {
			assertArrayOfRecords(block.fields, `${path}.fields`);
		}

		if (block.type === 'input' && !isRecord(block.element)) {
			throw new Error(`Invalid blocks: ${path}.element must be an object`);
		}

		assertValidNode(block, path, 0);
	});
}
