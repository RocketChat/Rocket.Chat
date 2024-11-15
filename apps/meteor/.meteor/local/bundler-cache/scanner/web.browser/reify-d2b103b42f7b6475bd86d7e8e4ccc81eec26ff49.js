module.export({FuselageMessageSurfaceRenderer:()=>FuselageMessageSurfaceRenderer});let _jsx;module.link("react/jsx-runtime",{jsx(v){_jsx=v}},0);let UiKit;module.link('@rocket.chat/ui-kit',{"*"(v){UiKit=v}},1);let FuselageSurfaceRenderer,renderTextObject;module.link('./FuselageSurfaceRenderer',{FuselageSurfaceRenderer(v){FuselageSurfaceRenderer=v},renderTextObject(v){renderTextObject=v}},2);let VideoConferenceBlock;module.link('../blocks/VideoConferenceBlock/VideoConferenceBlock',{default(v){VideoConferenceBlock=v}},3);let AppIdProvider;module.link('../contexts/AppIdContext',{AppIdProvider(v){AppIdProvider=v}},4);




class FuselageMessageSurfaceRenderer extends FuselageSurfaceRenderer {
    constructor() {
        super([
            'actions',
            'context',
            'divider',
            'image',
            'input',
            'section',
            'preview',
            'video_conf',
        ]);
        this.plain_text = renderTextObject;
        this.mrkdwn = renderTextObject;
    }
    video_conf(block, context, index) {
        if (context === UiKit.BlockContext.BLOCK) {
            return (_jsx(AppIdProvider, { appId: block.appId, children: _jsx(VideoConferenceBlock, { block: block, context: context, index: index, surfaceRenderer: this }) }, index));
        }
        return null;
    }
}
//# sourceMappingURL=FuselageMessageSurfaceRenderer.js.map