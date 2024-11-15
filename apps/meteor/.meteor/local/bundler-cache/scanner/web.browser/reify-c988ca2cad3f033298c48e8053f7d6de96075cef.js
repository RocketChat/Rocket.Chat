module.export({ContextualBarSurfaceRenderer:()=>ContextualBarSurfaceRenderer});let _jsx;module.link("react/jsx-runtime",{jsx(v){_jsx=v}},0);let UiKit;module.link('@rocket.chat/ui-kit',{"*"(v){UiKit=v}},1);let TabNavigationBlock;module.link('../blocks/TabNavigationBlock',{default(v){TabNavigationBlock=v}},2);let AppIdProvider;module.link('../contexts/AppIdContext',{AppIdProvider(v){AppIdProvider=v}},3);let FuselageSurfaceRenderer,renderTextObject;module.link('./FuselageSurfaceRenderer',{FuselageSurfaceRenderer(v){FuselageSurfaceRenderer=v},renderTextObject(v){renderTextObject=v}},4);




class ContextualBarSurfaceRenderer extends FuselageSurfaceRenderer {
    constructor() {
        super([
            'actions',
            'context',
            'divider',
            'image',
            'input',
            'section',
            'preview',
            'callout',
            'tab_navigation',
        ]);
        this.plain_text = renderTextObject;
        this.mrkdwn = renderTextObject;
    }
    tab_navigation(block, context, index) {
        if (context === UiKit.BlockContext.BLOCK) {
            return (_jsx(AppIdProvider, { appId: block.appId, children: _jsx(TabNavigationBlock, { block: block, context: context, index: index, surfaceRenderer: this }) }, index));
        }
        return null;
    }
}
//# sourceMappingURL=ContextualBarSurfaceRenderer.js.map