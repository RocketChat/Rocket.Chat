import { randomUUID } from 'node:crypto';

import type { IBlock } from '@rocket.chat/apps-engine/definition/uikit';
import type { LayoutBlock } from '@rocket.chat/ui-kit';

/**
 * Duplicated from `packages/apps/src/server/misc/UIHelper.ts` so the base-runtime
 * does not have to import the host's compiled `apps/dist` output (a CJS `require`
 * that bypasses the Deno import map, and would create a host→base-runtime build
 * cycle if imported the other way). Both imports here are type-only (erased at
 * transpile) except `node:crypto`, which is available in every runtime.
 *
 * This is the single source of truth once the host accessors that still use the
 * `src/server/misc` copy are removed in the teardown phase of the accessor
 * consolidation; until then the two copies are kept byte-for-byte identical.
 */
export class UIHelper {
	/**
	 * Assign blockId, appId and actionId to every block/element inside the array
	 * @param blocks the blocks that will be iterated and assigned the ids
	 * @param appId the appId that will be assigned to
	 * @returns the array of block with the ids properties assigned
	 */
	public static assignIds(blocks: Array<IBlock | LayoutBlock>, appId: string): Array<IBlock | LayoutBlock> {
		blocks.forEach((block: (IBlock | LayoutBlock) & { appId?: string; blockId?: string; elements?: Array<any> }) => {
			if (!block.appId) {
				block.appId = appId;
			}
			if (!block.blockId) {
				block.blockId = randomUUID();
			}
			if (block.elements) {
				block.elements.forEach((element) => {
					if (!element.actionId) {
						element.actionId = randomUUID();
					}
				});
			}
		});

		return blocks;
	}
}
