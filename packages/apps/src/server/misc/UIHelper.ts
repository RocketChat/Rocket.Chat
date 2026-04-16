import type { LayoutBlock } from '@rocket.chat/ui-kit';
import { v4 as uuid } from 'uuid';

import type { IBlock } from '@rocket.chat/apps-engine/definition/uikit';

export class UIHelper {
	/**
	 * Assign blockId, appId and actionId to every block/element inside the array
	 * @param blocks the blocks that will be iterated and assigned the ids
	 * @param appId the appId that will be assigned to
	 * @returns the array of block with the ids properties assigned
	 */
	public static assignIds(blocks: Array<IBlock | LayoutBlock>, appId: string): Array<IBlock | LayoutBlock> {
		blocks.forEach((block) => {
			const b = block as (IBlock | LayoutBlock) & { appId?: string; blockId?: string; elements?: Array<any> };
			if (!b.appId) {
				b.appId = appId;
			}
			if (!b.blockId) {
				b.blockId = uuid();
			}
			if (b.elements) {
				b.elements.forEach((element) => {
					if (!element.actionId) {
						element.actionId = uuid();
					}
				});
			}
		});

		return blocks;
	}
}
