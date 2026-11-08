import type * as UiKit from '@rocket.chat/ui-kit';

import { renderNestedBlocks } from './renderNestedBlocks';

const rendered: UiKit.Block[][] = [];
const surfaceRenderer = {
	render: (blocks: UiKit.Block[]) => {
		rendered.push(blocks);
		return [];
	},
} as unknown as UiKit.SurfaceRenderer<never>;

beforeEach(() => {
	rendered.length = 0;
});

it('hands over the very same block when it has both ids, and a copy with the ids of the holder when it lacks one', () => {
	const complete = { type: 'divider', appId: 'a', blockId: 'b' } as UiKit.Block;
	const incomplete = { type: 'divider' } as UiKit.Block;

	renderNestedBlocks(surfaceRenderer as never, [complete, incomplete], ['divider'], { appId: 'holder-app', blockId: 'holder-block' });

	expect(rendered[0][0]).toBe(complete);
	expect(rendered[0][1]).toEqual({ type: 'divider', appId: 'holder-app', blockId: 'holder-block' });
	expect(rendered[0][1]).not.toBe(incomplete);
});
