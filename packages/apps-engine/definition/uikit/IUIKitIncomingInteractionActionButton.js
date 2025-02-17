"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isUIKitIncomingInteractionActionButtonMessageBox = void 0;
const isUIKitIncomingInteractionActionButtonMessageBox = (interaction) => {
    return interaction.payload.context === 'messageBoxAction';
};
exports.isUIKitIncomingInteractionActionButtonMessageBox = isUIKitIncomingInteractionActionButtonMessageBox;
//# sourceMappingURL=IUIKitIncomingInteractionActionButton.js.map