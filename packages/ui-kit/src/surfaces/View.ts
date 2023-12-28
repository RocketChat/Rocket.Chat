import typia from 'typia';

import type { LayoutBlock } from '../blocks/LayoutBlock';

/**
 * An instance of a UiKit surface and its metadata.
 */
export type View = {
	/** The ID of the app that created this view. */
	appId: string;
	/** The blocks that make up the content of the view. */
	blocks: LayoutBlock[];
};

export const isView = typia.createIs<View>();
