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
	 * Assign blockId, appId and actionId to every block/element inside the array, including those nested in
	 * container, layout, conditional, card and data_table blocks
	 * @param blocks the blocks that will be iterated and assigned the ids
	 * @param appId the appId that will be assigned to
	 * @returns the array of block with the ids properties assigned
	 */
	public static assignIds(blocks: Array<IBlock | LayoutBlock>, appId: string): Array<IBlock | LayoutBlock> {
		blocks.forEach((block) => UIHelper.assignBlockIds(block, appId));

		return blocks;
	}

	private static assignBlockIds(block: any, appId: string): void {
		if (!block || typeof block !== 'object') {
			return;
		}

		if (!block.appId) {
			block.appId = appId;
		}
		if (!block.blockId) {
			block.blockId = randomUUID();
		}

		// A carousel holds cards, which are blocks of their own.
		if (block.type === 'carousel') {
			UIHelper.assignNested(block.elements, appId);
		} else {
			UIHelper.assignActionIds(block.elements);
		}

		// Elements sit in `elements` (actions, context), `accessory` (section), `element` (input), `actions` (card) or `tabs`.
		UIHelper.assignActionIds(block.accessory);
		UIHelper.assignActionIds(block.element);
		UIHelper.assignActionIds(block.actions);
		UIHelper.assignActionIds(block.tabs);

		if (block.type === 'data_table' && Array.isArray(block.rows)) {
			block.rows.forEach((row: unknown) => {
				if (Array.isArray(row)) {
					row.forEach((cell) => cell?.type === 'action_cell' && UIHelper.assignActionIds(cell.element));
				}
			});
		}

		UIHelper.assignNested(block.child_blocks, appId);
		UIHelper.assignNested(block.fallback, appId);
		UIHelper.assignNested(block.render, appId);

		if (block.type === 'layout' && Array.isArray(block.rows)) {
			block.rows.forEach((row: any) => {
				if (Array.isArray(row?.items)) {
					row.items.forEach((item: any) => UIHelper.assignBlockIds(item?.block, appId));
				}
			});
		}
	}

	private static assignNested(blocks: unknown, appId: string): void {
		if (Array.isArray(blocks)) {
			blocks.forEach((block) => UIHelper.assignBlockIds(block, appId));
		}
	}

	private static assignActionIds(elements: unknown): void {
		[elements].flat().forEach((element: any) => {
			if (element && typeof element === 'object' && !element.actionId) {
				element.actionId = randomUUID();
			}
		});
	}
}
