import type * as UiKit from '@rocket.chat/ui-kit';
import type { ReactElement } from 'react';

type Holder = { appId?: string; blockId?: string };

const inheritIds = (block: UiKit.LayoutBlock, holder: Holder): UiKit.LayoutBlock => {
	const appId = block.appId ?? holder.appId;
	const blockId = block.blockId ?? holder.blockId;

	return appId === block.appId && blockId === block.blockId ? block : { ...block, appId, blockId };
};

/**
 * Draws blocks held by another block. The surface's own allowlist still applies to them, as it does to top-level
 * blocks, on top of the types the holder accepts. A nested block that lacks them takes the ids of its holder, so its
 * elements dispatch as the app that sent the holder.
 */
export const renderNestedBlocks = (
	surfaceRenderer: UiKit.SurfaceRenderer<ReactElement<any>>,
	blocks: readonly UiKit.LayoutBlock[] | undefined,
	acceptedTypes: readonly string[],
	holder: Holder,
): ReactElement<any>[] =>
	Array.isArray(blocks)
		? surfaceRenderer.render(
				blocks.filter((block) => block && acceptedTypes.includes(block.type)).map((block) => inheritIds(block, holder)),
			)
		: [];
