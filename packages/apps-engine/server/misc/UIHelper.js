"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UIHelper = void 0;
const uuid_1 = require("uuid");
class UIHelper {
    /**
     * Assign blockId, appId and actionId to every block/element inside the array
     * @param blocks the blocks that will be iterated and assigned the ids
     * @param appId the appId that will be assigned to
     * @returns the array of block with the ids properties assigned
     */
    static assignIds(blocks, appId) {
        blocks.forEach((block) => {
            if (!block.appId) {
                block.appId = appId;
            }
            if (!block.blockId) {
                block.blockId = (0, uuid_1.v4)();
            }
            if (block.elements) {
                block.elements.forEach((element) => {
                    if (!element.actionId) {
                        element.actionId = (0, uuid_1.v4)();
                    }
                });
            }
        });
        return blocks;
    }
}
exports.UIHelper = UIHelper;
//# sourceMappingURL=UIHelper.js.map