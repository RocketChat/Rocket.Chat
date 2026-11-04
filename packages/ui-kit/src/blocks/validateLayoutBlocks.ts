import typia from 'typia';

import type { LayoutBlock } from './LayoutBlock';
import { checkBlockLimits, maxBlocksPerMessage } from './blockLimits';
import { withElementIds } from './withElementIds';

export type LayoutBlockError = {
	/** Where the mismatch is, as `$input[0].elements[1].text`. */
	path: string;
	/** The type the value should have had there. */
	expected: string;
};

const validate = typia.createValidate<LayoutBlock[]>();

/**
 * Lists where blocks sent by an app depart from the `LayoutBlock` types or exceed the size limits; an empty list
 * means they match. `maxBlocks` is what the surface allows: `maxBlocksPerMessage` unless it is a view.
 */
export const validateLayoutBlocks = (blocks: unknown, maxBlocks: number = maxBlocksPerMessage): LayoutBlockError[] => {
	const result = validate(withElementIds(blocks));
	const typeErrors = result.success ? [] : result.errors.map(({ path, expected }) => ({ path, expected }));

	return [...typeErrors, ...checkBlockLimits(blocks, maxBlocks)];
};

export { maxBlocksPerMessage, maxBlocksPerView } from './blockLimits';
