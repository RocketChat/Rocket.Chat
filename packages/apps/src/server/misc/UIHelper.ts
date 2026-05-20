import { randomUUID } from 'node:crypto';

import type { IBlock } from '@rocket.chat/apps-engine/definition/uikit';
import type { LayoutBlock } from '@rocket.chat/ui-kit';

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
