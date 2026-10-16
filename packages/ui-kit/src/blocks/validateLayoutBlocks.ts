import typia from 'typia';

import type { LayoutBlock } from './LayoutBlock';
import { withElementIds } from './withElementIds';

export type LayoutBlockError = {
	/** Where the mismatch is, as `$input[0].elements[1].text`. */
	path: string;
	/** The type the value should have had there. */
	expected: string;
};

const validate = typia.createValidate<LayoutBlock[]>();

/** Lists where blocks sent by an app depart from the `LayoutBlock` types; an empty list means they match. */
export const validateLayoutBlocks = (blocks: unknown): LayoutBlockError[] => {
	const result = validate(withElementIds(blocks));

	return result.success ? [] : result.errors.map(({ path, expected }) => ({ path, expected }));
};
