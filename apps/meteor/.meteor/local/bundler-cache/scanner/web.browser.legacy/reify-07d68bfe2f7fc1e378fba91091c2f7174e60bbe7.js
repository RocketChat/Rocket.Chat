"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FuselageSurfaceRenderer = exports.renderTextObject = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const UiKit = __importStar(require("@rocket.chat/ui-kit"));
const ActionsBlock_1 = __importDefault(require("../blocks/ActionsBlock"));
const CalloutBlock_1 = __importDefault(require("../blocks/CalloutBlock"));
const ContextBlock_1 = __importDefault(require("../blocks/ContextBlock"));
const DividerBlock_1 = __importDefault(require("../blocks/DividerBlock"));
const ImageBlock_1 = __importDefault(require("../blocks/ImageBlock"));
const InputBlock_1 = __importDefault(require("../blocks/InputBlock"));
const PreviewBlock_1 = __importDefault(require("../blocks/PreviewBlock"));
const SectionBlock_1 = __importDefault(require("../blocks/SectionBlock"));
const AppIdContext_1 = require("../contexts/AppIdContext");
const ButtonElement_1 = __importDefault(require("../elements/ButtonElement"));
const ChannelsSelectElement_1 = __importDefault(require("../elements/ChannelsSelectElement/ChannelsSelectElement"));
const MultiChannelsSelectElement_1 = __importDefault(require("../elements/ChannelsSelectElement/MultiChannelsSelectElement"));
const CheckboxElement_1 = __importDefault(require("../elements/CheckboxElement"));
const DatePickerElement_1 = __importDefault(require("../elements/DatePickerElement"));
const ImageElement_1 = __importDefault(require("../elements/ImageElement"));
const LinearScaleElement_1 = __importDefault(require("../elements/LinearScaleElement"));
const MarkdownTextElement_1 = __importDefault(require("../elements/MarkdownTextElement"));
const MultiStaticSelectElement_1 = __importDefault(require("../elements/MultiStaticSelectElement"));
const OverflowElement_1 = __importDefault(require("../elements/OverflowElement"));
const PlainTextElement_1 = __importDefault(require("../elements/PlainTextElement"));
const PlainTextInputElement_1 = __importDefault(require("../elements/PlainTextInputElement"));
const RadioButtonElement_1 = __importDefault(require("../elements/RadioButtonElement"));
const StaticSelectElement_1 = __importDefault(require("../elements/StaticSelectElement"));
const TimePickerElement_1 = __importDefault(require("../elements/TimePickerElement"));
const ToggleSwitchElement_1 = __importDefault(require("../elements/ToggleSwitchElement"));
const MultiUsersSelectElement_1 = __importDefault(require("../elements/UsersSelectElement/MultiUsersSelectElement"));
const UsersSelectElement_1 = __importDefault(require("../elements/UsersSelectElement/UsersSelectElement"));
const textObjectRenderers = {
    plain_text: (textObject, index) => ((0, jsx_runtime_1.jsx)(PlainTextElement_1.default, { textObject: textObject }, index)),
    mrkdwn: (textObject, index) => ((0, jsx_runtime_1.jsx)(MarkdownTextElement_1.default, { textObject: textObject }, index)),
};
const renderTextObject = (textObject, context, index) => {
    if (context === UiKit.BlockContext.BLOCK) {
        return null;
    }
    switch (textObject.type) {
        case 'plain_text':
            return textObjectRenderers.plain_text(textObject, index);
        case 'mrkdwn':
            return textObjectRenderers.mrkdwn(textObject, index);
    }
};
exports.renderTextObject = renderTextObject;
const isImageBlock = (_elementOrBlock, context) => {
    return context === UiKit.BlockContext.BLOCK;
};
class FuselageSurfaceRenderer extends UiKit.SurfaceRenderer {
    constructor(allowedBlocks) {
        super(allowedBlocks || [
            'actions',
            'context',
            'divider',
            'image',
            'input',
            'section',
            'preview',
        ]);
    }
    plain_text(textObject, context, index) {
        if (context === UiKit.BlockContext.BLOCK) {
            return null;
        }
        return textObjectRenderers.plain_text(textObject, index);
    }
    mrkdwn(textObject, context, index) {
        if (context === UiKit.BlockContext.BLOCK) {
            return null;
        }
        return (0, jsx_runtime_1.jsx)(MarkdownTextElement_1.default, { textObject: textObject }, index);
    }
    text(textObject, context, index) {
        if (textObject.type === 'mrkdwn') {
            return this.mrkdwn(textObject, context, index);
        }
        return this.plain_text(textObject, context, index);
    }
    actions(block, context, index) {
        if (context === UiKit.BlockContext.BLOCK) {
            return ((0, jsx_runtime_1.jsx)(AppIdContext_1.AppIdProvider, { appId: block.appId, children: (0, jsx_runtime_1.jsx)(ActionsBlock_1.default, { block: block, context: context, index: index, surfaceRenderer: this }) }, index));
        }
        return null;
    }
    preview(block, context, index) {
        if (context !== UiKit.BlockContext.BLOCK) {
            return null;
        }
        return ((0, jsx_runtime_1.jsx)(PreviewBlock_1.default, { block: block, context: context, index: index, surfaceRenderer: this }, index));
    }
    context(block, context, index) {
        if (context === UiKit.BlockContext.BLOCK) {
            return ((0, jsx_runtime_1.jsx)(AppIdContext_1.AppIdProvider, { appId: block.appId, children: (0, jsx_runtime_1.jsx)(ContextBlock_1.default, { block: block, context: context, index: index, surfaceRenderer: this }) }, index));
        }
        return null;
    }
    divider(block, context, index) {
        if (context === UiKit.BlockContext.BLOCK) {
            return ((0, jsx_runtime_1.jsx)(AppIdContext_1.AppIdProvider, { appId: block.appId, children: (0, jsx_runtime_1.jsx)(DividerBlock_1.default, { block: block, context: context, index: index, surfaceRenderer: this }) }, index));
        }
        return null;
    }
    image(block, context, index) {
        if (isImageBlock(block, context)) {
            return ((0, jsx_runtime_1.jsx)(AppIdContext_1.AppIdProvider, { appId: block.appId, children: (0, jsx_runtime_1.jsx)(ImageBlock_1.default, { block: block, context: context, index: index, surfaceRenderer: this }) }, index));
        }
        return ((0, jsx_runtime_1.jsx)(ImageElement_1.default, { block: block, context: context, index: index, surfaceRenderer: this }, index));
    }
    input(block, context, index) {
        if (context === UiKit.BlockContext.BLOCK) {
            return ((0, jsx_runtime_1.jsx)(AppIdContext_1.AppIdProvider, { appId: block.appId, children: (0, jsx_runtime_1.jsx)(InputBlock_1.default, { block: block, context: context, index: index, surfaceRenderer: this }) }, block.element.actionId || index));
        }
        return null;
    }
    section(block, context, index) {
        if (context === UiKit.BlockContext.BLOCK) {
            return ((0, jsx_runtime_1.jsx)(AppIdContext_1.AppIdProvider, { appId: block.appId, children: (0, jsx_runtime_1.jsx)(SectionBlock_1.default, { block: block, context: context, index: index, surfaceRenderer: this }) }, index));
        }
        return null;
    }
    button(block, context, index) {
        if (context === UiKit.BlockContext.BLOCK) {
            return null;
        }
        return ((0, jsx_runtime_1.jsx)(AppIdContext_1.AppIdProvider, { appId: block.appId, children: (0, jsx_runtime_1.jsx)(ButtonElement_1.default, { block: block, context: context, index: index, surfaceRenderer: this }) }, index));
    }
    datepicker(block, context, index) {
        if (context === UiKit.BlockContext.BLOCK) {
            return null;
        }
        return ((0, jsx_runtime_1.jsx)(AppIdContext_1.AppIdProvider, { appId: block.appId, children: (0, jsx_runtime_1.jsx)(DatePickerElement_1.default, { block: block, context: context, index: index, surfaceRenderer: this }) }, block.actionId || index));
    }
    static_select(block, context, index) {
        if (context === UiKit.BlockContext.BLOCK) {
            return null;
        }
        return ((0, jsx_runtime_1.jsx)(AppIdContext_1.AppIdProvider, { appId: block.appId, children: (0, jsx_runtime_1.jsx)(StaticSelectElement_1.default, { block: block, context: context, index: index, surfaceRenderer: this }) }, block.actionId || index));
    }
    multi_static_select(block, context, index) {
        if (context === UiKit.BlockContext.BLOCK) {
            return null;
        }
        return ((0, jsx_runtime_1.jsx)(AppIdContext_1.AppIdProvider, { appId: block.appId, children: (0, jsx_runtime_1.jsx)(MultiStaticSelectElement_1.default, { block: block, context: context, index: index, surfaceRenderer: this }) }, block.actionId || index));
    }
    overflow(block, context, index) {
        if (context === UiKit.BlockContext.BLOCK) {
            return null;
        }
        return ((0, jsx_runtime_1.jsx)(AppIdContext_1.AppIdProvider, { appId: block.appId, children: (0, jsx_runtime_1.jsx)(OverflowElement_1.default, { block: block, context: context, index: index, surfaceRenderer: this }) }, index));
    }
    plain_text_input(block, context, index) {
        if (context === UiKit.BlockContext.BLOCK) {
            return null;
        }
        return ((0, jsx_runtime_1.jsx)(AppIdContext_1.AppIdProvider, { appId: block.appId, children: (0, jsx_runtime_1.jsx)(PlainTextInputElement_1.default, { block: block, context: context, index: index, surfaceRenderer: this }) }, block.actionId || index));
    }
    linear_scale(block, context, index) {
        if (context === UiKit.BlockContext.BLOCK) {
            return null;
        }
        return ((0, jsx_runtime_1.jsx)(AppIdContext_1.AppIdProvider, { appId: block.appId, children: (0, jsx_runtime_1.jsx)(LinearScaleElement_1.default, { block: block, context: context, index: index, surfaceRenderer: this }) }, block.actionId || index));
    }
    toggle_switch(block, context, index) {
        if (context === UiKit.BlockContext.BLOCK) {
            return null;
        }
        return ((0, jsx_runtime_1.jsx)(AppIdContext_1.AppIdProvider, { appId: block.appId, children: (0, jsx_runtime_1.jsx)(ToggleSwitchElement_1.default, { block: block, context: context, index: index, surfaceRenderer: this }) }, block.actionId || index));
    }
    radio_button(block, context, index) {
        if (context === UiKit.BlockContext.BLOCK) {
            return null;
        }
        return ((0, jsx_runtime_1.jsx)(AppIdContext_1.AppIdProvider, { appId: block.appId, children: (0, jsx_runtime_1.jsx)(RadioButtonElement_1.default, { block: block, context: context, index: index, surfaceRenderer: this }) }, block.actionId || index));
    }
    checkbox(block, context, index) {
        if (context === UiKit.BlockContext.BLOCK) {
            return null;
        }
        return ((0, jsx_runtime_1.jsx)(AppIdContext_1.AppIdProvider, { appId: block.appId, children: (0, jsx_runtime_1.jsx)(CheckboxElement_1.default, { block: block, context: context, index: index, surfaceRenderer: this }) }, block.actionId || index));
    }
    callout(block, context, index) {
        if (context === UiKit.BlockContext.BLOCK) {
            return ((0, jsx_runtime_1.jsx)(AppIdContext_1.AppIdProvider, { appId: block.appId, children: (0, jsx_runtime_1.jsx)(CalloutBlock_1.default, { block: block, context: context, index: index, surfaceRenderer: this }) }, index));
        }
        return null;
    }
    time_picker(block, context, index) {
        if (context === UiKit.BlockContext.BLOCK) {
            return null;
        }
        return ((0, jsx_runtime_1.jsx)(AppIdContext_1.AppIdProvider, { appId: block.appId, children: (0, jsx_runtime_1.jsx)(TimePickerElement_1.default, { block: block, context: context, index: index, surfaceRenderer: this }) }, block.actionId || index));
    }
    users_select(block, context, index) {
        if (context === UiKit.BlockContext.FORM) {
            return ((0, jsx_runtime_1.jsx)(UsersSelectElement_1.default, { block: block, context: context, index: index, surfaceRenderer: this }));
        }
        return null;
    }
    channels_select(block, context, index) {
        if (context === UiKit.BlockContext.FORM) {
            return ((0, jsx_runtime_1.jsx)(ChannelsSelectElement_1.default, { block: block, context: context, index: index, surfaceRenderer: this }));
        }
        return null;
    }
    multi_users_select(block, context, index) {
        if (context === UiKit.BlockContext.FORM) {
            return ((0, jsx_runtime_1.jsx)(MultiUsersSelectElement_1.default, { block: block, context: context, index: index, surfaceRenderer: this }));
        }
        return null;
    }
    multi_channels_select(block, context, index) {
        if (context === UiKit.BlockContext.FORM) {
            return ((0, jsx_runtime_1.jsx)(MultiChannelsSelectElement_1.default, { block: block, context: context, index: index, surfaceRenderer: this }));
        }
        return null;
    }
}
exports.FuselageSurfaceRenderer = FuselageSurfaceRenderer;
//# sourceMappingURL=FuselageSurfaceRenderer.js.map