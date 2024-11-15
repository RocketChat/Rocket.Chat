import type { LayoutBlock } from '@rocket.chat/ui-kit';
import type { IBlock } from '../../definition/uikit';
export declare class UIHelper {
    /**
     * Assign blockId, appId and actionId to every block/element inside the array
     * @param blocks the blocks that will be iterated and assigned the ids
     * @param appId the appId that will be assigned to
     * @returns the array of block with the ids properties assigned
     */
    static assignIds(blocks: Array<IBlock | LayoutBlock>, appId: string): Array<IBlock | LayoutBlock>;
}
