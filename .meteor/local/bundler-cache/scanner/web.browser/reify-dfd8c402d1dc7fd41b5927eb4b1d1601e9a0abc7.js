module.export({FuselageSurfaceRenderer:()=>FuselageSurfaceRenderer});let UiKit;module.link('@rocket.chat/ui-kit',{"*"(v){UiKit=v}},0);let React,Fragment;module.link('react',{default(v){React=v},Fragment(v){Fragment=v}},1);let ActionsBlock;module.link('../blocks/ActionsBlock',{default(v){ActionsBlock=v}},2);let ContextBlock;module.link('../blocks/ContextBlock',{default(v){ContextBlock=v}},3);let DividerBlock;module.link('../blocks/DividerBlock',{default(v){DividerBlock=v}},4);let ImageBlock;module.link('../blocks/ImageBlock',{default(v){ImageBlock=v}},5);let InputBlock;module.link('../blocks/InputBlock',{default(v){InputBlock=v}},6);let PreviewBlock;module.link('../blocks/PreviewBlock',{default(v){PreviewBlock=v}},7);let SectionBlock;module.link('../blocks/SectionBlock',{default(v){SectionBlock=v}},8);let ButtonElement;module.link('../elements/ButtonElement',{default(v){ButtonElement=v}},9);let DatePickerElement;module.link('../elements/DatePickerElement',{default(v){DatePickerElement=v}},10);let ImageElement;module.link('../elements/ImageElement',{default(v){ImageElement=v}},11);let LinearScaleElement;module.link('../elements/LinearScaleElement',{default(v){LinearScaleElement=v}},12);let MultiStaticSelectElement;module.link('../elements/MultiStaticSelectElement',{default(v){MultiStaticSelectElement=v}},13);let OverflowElement;module.link('../elements/OverflowElement',{default(v){OverflowElement=v}},14);let PlainTextInputElement;module.link('../elements/PlainTextInputElement',{default(v){PlainTextInputElement=v}},15);let StaticSelectElement;module.link('../elements/StaticSelectElement',{default(v){StaticSelectElement=v}},16);var __extends = (this && this.__extends) || (function () {
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
        return text ? React.createElement(Fragment, { key: index }, text) : null;
    };
    FuselageSurfaceRenderer.prototype.mrkdwn = function (_a, context, index) {
        var _b = _a.text, text = _b === void 0 ? '' : _b;
        if (context === UiKit.BlockContext.BLOCK) {
            return null;
        }
        return text ? React.createElement(Fragment, { key: index }, text) : null;
    };
    FuselageSurfaceRenderer.prototype.actions = function (block, context, index) {
        if (context === UiKit.BlockContext.BLOCK) {
            return (React.createElement(ActionsBlock, { key: index, block: block, context: context, index: index, surfaceRenderer: this }));
        }
        return null;
    };
    FuselageSurfaceRenderer.prototype.preview = function (block, context, index) {
        if (context !== UiKit.BlockContext.BLOCK) {
            return null;
        }
        return (React.createElement(PreviewBlock, { key: index, block: block, context: context, index: index, surfaceRenderer: this }));
    };
    FuselageSurfaceRenderer.prototype.context = function (block, context, index) {
        if (context === UiKit.BlockContext.BLOCK) {
            return (React.createElement(ContextBlock, { key: index, block: block, context: context, index: index, surfaceRenderer: this }));
        }
        return null;
    };
    FuselageSurfaceRenderer.prototype.divider = function (block, context, index) {
        if (context === UiKit.BlockContext.BLOCK) {
            return (React.createElement(DividerBlock, { key: index, block: block, context: context, index: index, surfaceRenderer: this }));
        }
        return null;
    };
    FuselageSurfaceRenderer.prototype.image = function (block, context, index) {
        if (context === UiKit.BlockContext.BLOCK) {
            return (React.createElement(ImageBlock, { key: index, block: block, context: context, index: index, surfaceRenderer: this }));
        }
        return (React.createElement(ImageElement, { key: index, block: block, context: context, index: index, surfaceRenderer: this }));
    };
    FuselageSurfaceRenderer.prototype.input = function (block, context, index) {
        if (context === UiKit.BlockContext.BLOCK) {
            return (React.createElement(InputBlock, { key: block.element.actionId || index, block: block, context: context, index: index, surfaceRenderer: this }));
        }
        return null;
    };
    FuselageSurfaceRenderer.prototype.section = function (block, context, index) {
        if (context === UiKit.BlockContext.BLOCK) {
            return (React.createElement(SectionBlock, { key: index, block: block, context: context, index: index, surfaceRenderer: this }));
        }
        return null;
    };
    FuselageSurfaceRenderer.prototype.button = function (block, context, index) {
        if (context === UiKit.BlockContext.BLOCK) {
            return null;
        }
        return (React.createElement(ButtonElement, { key: index, block: block, context: context, index: index, surfaceRenderer: this }));
    };
    FuselageSurfaceRenderer.prototype.datepicker = function (block, context, index) {
        if (context === UiKit.BlockContext.BLOCK) {
            return null;
        }
        return (React.createElement(DatePickerElement, { key: block.actionId || index, block: block, context: context, index: index, surfaceRenderer: this }));
    };
    FuselageSurfaceRenderer.prototype.static_select = function (block, context, index) {
        if (context === UiKit.BlockContext.BLOCK) {
            return null;
        }
        return (React.createElement(StaticSelectElement, { key: block.actionId || index, block: block, context: context, index: index, surfaceRenderer: this }));
    };
    FuselageSurfaceRenderer.prototype.multi_static_select = function (block, context, index) {
        if (context === UiKit.BlockContext.BLOCK) {
            return null;
        }
        return (React.createElement(MultiStaticSelectElement, { key: block.actionId || index, block: block, context: context, index: index, surfaceRenderer: this }));
    };
    FuselageSurfaceRenderer.prototype.overflow = function (block, context, index) {
        if (context === UiKit.BlockContext.BLOCK) {
            return null;
        }
        return (React.createElement(OverflowElement, { key: index, block: block, context: context, index: index, surfaceRenderer: this }));
    };
    FuselageSurfaceRenderer.prototype.plain_text_input = function (block, context, index) {
        if (context === UiKit.BlockContext.BLOCK) {
            return null;
        }
        return (React.createElement(PlainTextInputElement, { key: block.actionId || index, block: block, context: context, index: index, surfaceRenderer: this }));
    };
    FuselageSurfaceRenderer.prototype.linear_scale = function (block, context, index) {
        if (context === UiKit.BlockContext.BLOCK) {
            return null;
        }
        return (React.createElement(LinearScaleElement, { key: block.actionId || index, block: block, context: context, index: index, surfaceRenderer: this }));
    };
    return FuselageSurfaceRenderer;
}(UiKit.SurfaceRenderer));

//# sourceMappingURL=FuselageSurfaceRenderer.js.map