"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
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
exports.FuselageSurfaceRenderer = void 0;
var UiKit = __importStar(require("@rocket.chat/ui-kit"));
var react_1 = __importStar(require("react"));
var ActionsBlock_1 = __importDefault(require("../blocks/ActionsBlock"));
var ContextBlock_1 = __importDefault(require("../blocks/ContextBlock"));
var DividerBlock_1 = __importDefault(require("../blocks/DividerBlock"));
var ImageBlock_1 = __importDefault(require("../blocks/ImageBlock"));
var InputBlock_1 = __importDefault(require("../blocks/InputBlock"));
var PreviewBlock_1 = __importDefault(require("../blocks/PreviewBlock"));
var SectionBlock_1 = __importDefault(require("../blocks/SectionBlock"));
var ButtonElement_1 = __importDefault(require("../elements/ButtonElement"));
var DatePickerElement_1 = __importDefault(require("../elements/DatePickerElement"));
var ImageElement_1 = __importDefault(require("../elements/ImageElement"));
var LinearScaleElement_1 = __importDefault(require("../elements/LinearScaleElement"));
var MultiStaticSelectElement_1 = __importDefault(require("../elements/MultiStaticSelectElement"));
var OverflowElement_1 = __importDefault(require("../elements/OverflowElement"));
var PlainTextInputElement_1 = __importDefault(require("../elements/PlainTextInputElement"));
var StaticSelectElement_1 = __importDefault(require("../elements/StaticSelectElement"));
var FuselageSurfaceRenderer = /** @class */ (function (_super) {
    __extends(FuselageSurfaceRenderer, _super);
    function FuselageSurfaceRenderer() {
        return _super.call(this, [
            'actions',
            'context',
            'divider',
            'image',
            'input',
            'section',
            'preview',
        ]) || this;
    }
    FuselageSurfaceRenderer.prototype.plain_text = function (_a, context, index) {
        var _b = _a.text, text = _b === void 0 ? '' : _b;
        if (context === UiKit.BlockContext.BLOCK) {
            return null;
        }
        return text ? react_1.default.createElement(react_1.Fragment, { key: index }, text) : null;
    };
    FuselageSurfaceRenderer.prototype.mrkdwn = function (_a, context, index) {
        var _b = _a.text, text = _b === void 0 ? '' : _b;
        if (context === UiKit.BlockContext.BLOCK) {
            return null;
        }
        return text ? react_1.default.createElement(react_1.Fragment, { key: index }, text) : null;
    };
    FuselageSurfaceRenderer.prototype.actions = function (block, context, index) {
        if (context === UiKit.BlockContext.BLOCK) {
            return (react_1.default.createElement(ActionsBlock_1.default, { key: index, block: block, context: context, index: index, surfaceRenderer: this }));
        }
        return null;
    };
    FuselageSurfaceRenderer.prototype.preview = function (block, context, index) {
        if (context !== UiKit.BlockContext.BLOCK) {
            return null;
        }
        return (react_1.default.createElement(PreviewBlock_1.default, { key: index, block: block, context: context, index: index, surfaceRenderer: this }));
    };
    FuselageSurfaceRenderer.prototype.context = function (block, context, index) {
        if (context === UiKit.BlockContext.BLOCK) {
            return (react_1.default.createElement(ContextBlock_1.default, { key: index, block: block, context: context, index: index, surfaceRenderer: this }));
        }
        return null;
    };
    FuselageSurfaceRenderer.prototype.divider = function (block, context, index) {
        if (context === UiKit.BlockContext.BLOCK) {
            return (react_1.default.createElement(DividerBlock_1.default, { key: index, block: block, context: context, index: index, surfaceRenderer: this }));
        }
        return null;
    };
    FuselageSurfaceRenderer.prototype.image = function (block, context, index) {
        if (context === UiKit.BlockContext.BLOCK) {
            return (react_1.default.createElement(ImageBlock_1.default, { key: index, block: block, context: context, index: index, surfaceRenderer: this }));
        }
        return (react_1.default.createElement(ImageElement_1.default, { key: index, block: block, context: context, index: index, surfaceRenderer: this }));
    };
    FuselageSurfaceRenderer.prototype.input = function (block, context, index) {
        if (context === UiKit.BlockContext.BLOCK) {
            return (react_1.default.createElement(InputBlock_1.default, { key: block.element.actionId || index, block: block, context: context, index: index, surfaceRenderer: this }));
        }
        return null;
    };
    FuselageSurfaceRenderer.prototype.section = function (block, context, index) {
        if (context === UiKit.BlockContext.BLOCK) {
            return (react_1.default.createElement(SectionBlock_1.default, { key: index, block: block, context: context, index: index, surfaceRenderer: this }));
        }
        return null;
    };
    FuselageSurfaceRenderer.prototype.button = function (block, context, index) {
        if (context === UiKit.BlockContext.BLOCK) {
            return null;
        }
        return (react_1.default.createElement(ButtonElement_1.default, { key: index, block: block, context: context, index: index, surfaceRenderer: this }));
    };
    FuselageSurfaceRenderer.prototype.datepicker = function (block, context, index) {
        if (context === UiKit.BlockContext.BLOCK) {
            return null;
        }
        return (react_1.default.createElement(DatePickerElement_1.default, { key: block.actionId || index, block: block, context: context, index: index, surfaceRenderer: this }));
    };
    FuselageSurfaceRenderer.prototype.static_select = function (block, context, index) {
        if (context === UiKit.BlockContext.BLOCK) {
            return null;
        }
        return (react_1.default.createElement(StaticSelectElement_1.default, { key: block.actionId || index, block: block, context: context, index: index, surfaceRenderer: this }));
    };
    FuselageSurfaceRenderer.prototype.multi_static_select = function (block, context, index) {
        if (context === UiKit.BlockContext.BLOCK) {
            return null;
        }
        return (react_1.default.createElement(MultiStaticSelectElement_1.default, { key: block.actionId || index, block: block, context: context, index: index, surfaceRenderer: this }));
    };
    FuselageSurfaceRenderer.prototype.overflow = function (block, context, index) {
        if (context === UiKit.BlockContext.BLOCK) {
            return null;
        }
        return (react_1.default.createElement(OverflowElement_1.default, { key: index, block: block, context: context, index: index, surfaceRenderer: this }));
    };
    FuselageSurfaceRenderer.prototype.plain_text_input = function (block, context, index) {
        if (context === UiKit.BlockContext.BLOCK) {
            return null;
        }
        return (react_1.default.createElement(PlainTextInputElement_1.default, { key: block.actionId || index, block: block, context: context, index: index, surfaceRenderer: this }));
    };
    FuselageSurfaceRenderer.prototype.linear_scale = function (block, context, index) {
        if (context === UiKit.BlockContext.BLOCK) {
            return null;
        }
        return (react_1.default.createElement(LinearScaleElement_1.default, { key: block.actionId || index, block: block, context: context, index: index, surfaceRenderer: this }));
    };
    return FuselageSurfaceRenderer;
}(UiKit.SurfaceRenderer));
exports.FuselageSurfaceRenderer = FuselageSurfaceRenderer;
//# sourceMappingURL=FuselageSurfaceRenderer.js.map