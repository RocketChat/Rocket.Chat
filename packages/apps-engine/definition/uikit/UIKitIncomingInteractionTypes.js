"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isMessageBoxIncomingInteraction = isMessageBoxIncomingInteraction;
const ui_1 = require("../ui");
function isMessageBoxIncomingInteraction(interaction) {
    return interaction.buttonContext === ui_1.UIActionButtonContext.MESSAGE_BOX_ACTION;
}
//# sourceMappingURL=UIKitIncomingInteractionTypes.js.map