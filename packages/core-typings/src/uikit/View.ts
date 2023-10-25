import type { LayoutBlock } from '@rocket.chat/ui-kit';

/**
 * An instance of a UiKit surface and its metadata.
 */
export type View = {
	appId: string;
	blocks: LayoutBlock[];
};
