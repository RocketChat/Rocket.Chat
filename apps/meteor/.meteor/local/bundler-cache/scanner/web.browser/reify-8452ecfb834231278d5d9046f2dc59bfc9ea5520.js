module.export({bannerParser:()=>bannerParser,messageParser:()=>messageParser,modalParser:()=>modalParser,contextualBarParser:()=>contextualBarParser,UiKitBanner:()=>UiKitBanner,UiKitMessage:()=>UiKitMessage,UiKitModal:()=>UiKitModal,UiKitContextualBar:()=>UiKitContextualBar},true);let BannerSurface;module.link('./BannerSurface',{default(v){BannerSurface=v}},0);let BannerSurfaceRenderer;module.link('./BannerSurfaceRenderer',{BannerSurfaceRenderer(v){BannerSurfaceRenderer=v}},1);let ContextualBarSurface;module.link('./ContextualBarSurface',{default(v){ContextualBarSurface=v}},2);let ContextualBarSurfaceRenderer;module.link('./ContextualBarSurfaceRenderer',{ContextualBarSurfaceRenderer(v){ContextualBarSurfaceRenderer=v}},3);let FuselageMessageSurfaceRenderer;module.link('./FuselageMessageSurfaceRenderer',{FuselageMessageSurfaceRenderer(v){FuselageMessageSurfaceRenderer=v}},4);let MessageSurface;module.link('./MessageSurface',{default(v){MessageSurface=v}},5);let ModalSurface;module.link('./ModalSurface',{default(v){ModalSurface=v}},6);let ModalSurfaceRenderer;module.link('./ModalSurfaceRenderer',{ModalSurfaceRenderer(v){ModalSurfaceRenderer=v}},7);let createSurfaceRenderer;module.link('./createSurfaceRenderer',{createSurfaceRenderer(v){createSurfaceRenderer=v}},8);








const bannerParser = new BannerSurfaceRenderer();
const messageParser = new FuselageMessageSurfaceRenderer();
const modalParser = new ModalSurfaceRenderer();
const contextualBarParser = new ContextualBarSurfaceRenderer();
const UiKitBanner = createSurfaceRenderer(BannerSurface, bannerParser);
const UiKitMessage = createSurfaceRenderer(MessageSurface, messageParser);
const UiKitModal = createSurfaceRenderer(ModalSurface, modalParser);
const UiKitContextualBar = createSurfaceRenderer(ContextualBarSurface, contextualBarParser);
//# sourceMappingURL=index.js.map