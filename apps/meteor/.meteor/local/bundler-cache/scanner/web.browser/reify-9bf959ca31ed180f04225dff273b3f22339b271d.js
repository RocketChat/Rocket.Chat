module.export({FuselageSurfaceRenderer:()=>FuselageSurfaceRenderer});module.export({renderTextObject:()=>renderTextObject},true);let _jsx;module.link("react/jsx-runtime",{jsx(v){_jsx=v}},0);let UiKit;module.link('@rocket.chat/ui-kit',{"*"(v){UiKit=v}},1);let ActionsBlock;module.link('../blocks/ActionsBlock',{default(v){ActionsBlock=v}},2);let CalloutBlock;module.link('../blocks/CalloutBlock',{default(v){CalloutBlock=v}},3);let ContextBlock;module.link('../blocks/ContextBlock',{default(v){ContextBlock=v}},4);let DividerBlock;module.link('../blocks/DividerBlock',{default(v){DividerBlock=v}},5);let ImageBlock;module.link('../blocks/ImageBlock',{default(v){ImageBlock=v}},6);let InputBlock;module.link('../blocks/InputBlock',{default(v){InputBlock=v}},7);let PreviewBlock;module.link('../blocks/PreviewBlock',{default(v){PreviewBlock=v}},8);let SectionBlock;module.link('../blocks/SectionBlock',{default(v){SectionBlock=v}},9);let AppIdProvider;module.link('../contexts/AppIdContext',{AppIdProvider(v){AppIdProvider=v}},10);let ButtonElement;module.link('../elements/ButtonElement',{default(v){ButtonElement=v}},11);let ChannelsSelectElement;module.link('../elements/ChannelsSelectElement/ChannelsSelectElement',{default(v){ChannelsSelectElement=v}},12);let MultiChannelsSelectElement;module.link('../elements/ChannelsSelectElement/MultiChannelsSelectElement',{default(v){MultiChannelsSelectElement=v}},13);let CheckboxElement;module.link('../elements/CheckboxElement',{default(v){CheckboxElement=v}},14);let DatePickerElement;module.link('../elements/DatePickerElement',{default(v){DatePickerElement=v}},15);let ImageElement;module.link('../elements/ImageElement',{default(v){ImageElement=v}},16);let LinearScaleElement;module.link('../elements/LinearScaleElement',{default(v){LinearScaleElement=v}},17);let MarkdownTextElement;module.link('../elements/MarkdownTextElement',{default(v){MarkdownTextElement=v}},18);let MultiStaticSelectElement;module.link('../elements/MultiStaticSelectElement',{default(v){MultiStaticSelectElement=v}},19);let OverflowElement;module.link('../elements/OverflowElement',{default(v){OverflowElement=v}},20);let PlainTextElement;module.link('../elements/PlainTextElement',{default(v){PlainTextElement=v}},21);let PlainTextInputElement;module.link('../elements/PlainTextInputElement',{default(v){PlainTextInputElement=v}},22);let RadioButtonElement;module.link('../elements/RadioButtonElement',{default(v){RadioButtonElement=v}},23);let StaticSelectElement;module.link('../elements/StaticSelectElement',{default(v){StaticSelectElement=v}},24);let TimePickerElement;module.link('../elements/TimePickerElement',{default(v){TimePickerElement=v}},25);let ToggleSwitchElement;module.link('../elements/ToggleSwitchElement',{default(v){ToggleSwitchElement=v}},26);let MultiUsersSelectElement;module.link('../elements/UsersSelectElement/MultiUsersSelectElement',{default(v){MultiUsersSelectElement=v}},27);let UsersSelectElement;module.link('../elements/UsersSelectElement/UsersSelectElement',{default(v){UsersSelectElement=v}},28);




























const textObjectRenderers = {
    plain_text: (textObject, index) => (_jsx(PlainTextElement, { textObject: textObject }, index)),
    mrkdwn: (textObject, index) => (_jsx(MarkdownTextElement, { textObject: textObject }, index)),
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
        return _jsx(MarkdownTextElement, { textObject: textObject }, index);
    }
    text(textObject, context, index) {
        if (textObject.type === 'mrkdwn') {
            return this.mrkdwn(textObject, context, index);
        }
        return this.plain_text(textObject, context, index);
    }
    actions(block, context, index) {
        if (context === UiKit.BlockContext.BLOCK) {
            return (_jsx(AppIdProvider, { appId: block.appId, children: _jsx(ActionsBlock, { block: block, context: context, index: index, surfaceRenderer: this }) }, index));
        }
        return null;
    }
    preview(block, context, index) {
        if (context !== UiKit.BlockContext.BLOCK) {
            return null;
        }
        return (_jsx(PreviewBlock, { block: block, context: context, index: index, surfaceRenderer: this }, index));
    }
    context(block, context, index) {
        if (context === UiKit.BlockContext.BLOCK) {
            return (_jsx(AppIdProvider, { appId: block.appId, children: _jsx(ContextBlock, { block: block, context: context, index: index, surfaceRenderer: this }) }, index));
        }
        return null;
    }
    divider(block, context, index) {
        if (context === UiKit.BlockContext.BLOCK) {
            return (_jsx(AppIdProvider, { appId: block.appId, children: _jsx(DividerBlock, { block: block, context: context, index: index, surfaceRenderer: this }) }, index));
        }
        return null;
    }
    image(block, context, index) {
        if (isImageBlock(block, context)) {
            return (_jsx(AppIdProvider, { appId: block.appId, children: _jsx(ImageBlock, { block: block, context: context, index: index, surfaceRenderer: this }) }, index));
        }
        return (_jsx(ImageElement, { block: block, context: context, index: index, surfaceRenderer: this }, index));
    }
    input(block, context, index) {
        if (context === UiKit.BlockContext.BLOCK) {
            return (_jsx(AppIdProvider, { appId: block.appId, children: _jsx(InputBlock, { block: block, context: context, index: index, surfaceRenderer: this }) }, block.element.actionId || index));
        }
        return null;
    }
    section(block, context, index) {
        if (context === UiKit.BlockContext.BLOCK) {
            return (_jsx(AppIdProvider, { appId: block.appId, children: _jsx(SectionBlock, { block: block, context: context, index: index, surfaceRenderer: this }) }, index));
        }
        return null;
    }
    button(block, context, index) {
        if (context === UiKit.BlockContext.BLOCK) {
            return null;
        }
        return (_jsx(AppIdProvider, { appId: block.appId, children: _jsx(ButtonElement, { block: block, context: context, index: index, surfaceRenderer: this }) }, index));
    }
    datepicker(block, context, index) {
        if (context === UiKit.BlockContext.BLOCK) {
            return null;
        }
        return (_jsx(AppIdProvider, { appId: block.appId, children: _jsx(DatePickerElement, { block: block, context: context, index: index, surfaceRenderer: this }) }, block.actionId || index));
    }
    static_select(block, context, index) {
        if (context === UiKit.BlockContext.BLOCK) {
            return null;
        }
        return (_jsx(AppIdProvider, { appId: block.appId, children: _jsx(StaticSelectElement, { block: block, context: context, index: index, surfaceRenderer: this }) }, block.actionId || index));
    }
    multi_static_select(block, context, index) {
        if (context === UiKit.BlockContext.BLOCK) {
            return null;
        }
        return (_jsx(AppIdProvider, { appId: block.appId, children: _jsx(MultiStaticSelectElement, { block: block, context: context, index: index, surfaceRenderer: this }) }, block.actionId || index));
    }
    overflow(block, context, index) {
        if (context === UiKit.BlockContext.BLOCK) {
            return null;
        }
        return (_jsx(AppIdProvider, { appId: block.appId, children: _jsx(OverflowElement, { block: block, context: context, index: index, surfaceRenderer: this }) }, index));
    }
    plain_text_input(block, context, index) {
        if (context === UiKit.BlockContext.BLOCK) {
            return null;
        }
        return (_jsx(AppIdProvider, { appId: block.appId, children: _jsx(PlainTextInputElement, { block: block, context: context, index: index, surfaceRenderer: this }) }, block.actionId || index));
    }
    linear_scale(block, context, index) {
        if (context === UiKit.BlockContext.BLOCK) {
            return null;
        }
        return (_jsx(AppIdProvider, { appId: block.appId, children: _jsx(LinearScaleElement, { block: block, context: context, index: index, surfaceRenderer: this }) }, block.actionId || index));
    }
    toggle_switch(block, context, index) {
        if (context === UiKit.BlockContext.BLOCK) {
            return null;
        }
        return (_jsx(AppIdProvider, { appId: block.appId, children: _jsx(ToggleSwitchElement, { block: block, context: context, index: index, surfaceRenderer: this }) }, block.actionId || index));
    }
    radio_button(block, context, index) {
        if (context === UiKit.BlockContext.BLOCK) {
            return null;
        }
        return (_jsx(AppIdProvider, { appId: block.appId, children: _jsx(RadioButtonElement, { block: block, context: context, index: index, surfaceRenderer: this }) }, block.actionId || index));
    }
    checkbox(block, context, index) {
        if (context === UiKit.BlockContext.BLOCK) {
            return null;
        }
        return (_jsx(AppIdProvider, { appId: block.appId, children: _jsx(CheckboxElement, { block: block, context: context, index: index, surfaceRenderer: this }) }, block.actionId || index));
    }
    callout(block, context, index) {
        if (context === UiKit.BlockContext.BLOCK) {
            return (_jsx(AppIdProvider, { appId: block.appId, children: _jsx(CalloutBlock, { block: block, context: context, index: index, surfaceRenderer: this }) }, index));
        }
        return null;
    }
    time_picker(block, context, index) {
        if (context === UiKit.BlockContext.BLOCK) {
            return null;
        }
        return (_jsx(AppIdProvider, { appId: block.appId, children: _jsx(TimePickerElement, { block: block, context: context, index: index, surfaceRenderer: this }) }, block.actionId || index));
    }
    users_select(block, context, index) {
        if (context === UiKit.BlockContext.FORM) {
            return (_jsx(UsersSelectElement, { block: block, context: context, index: index, surfaceRenderer: this }));
        }
        return null;
    }
    channels_select(block, context, index) {
        if (context === UiKit.BlockContext.FORM) {
            return (_jsx(ChannelsSelectElement, { block: block, context: context, index: index, surfaceRenderer: this }));
        }
        return null;
    }
    multi_users_select(block, context, index) {
        if (context === UiKit.BlockContext.FORM) {
            return (_jsx(MultiUsersSelectElement, { block: block, context: context, index: index, surfaceRenderer: this }));
        }
        return null;
    }
    multi_channels_select(block, context, index) {
        if (context === UiKit.BlockContext.FORM) {
            return (_jsx(MultiChannelsSelectElement, { block: block, context: context, index: index, surfaceRenderer: this }));
        }
        return null;
    }
}
//# sourceMappingURL=FuselageSurfaceRenderer.js.map