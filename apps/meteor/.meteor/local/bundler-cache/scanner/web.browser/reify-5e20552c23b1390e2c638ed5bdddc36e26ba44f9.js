module.export({createSurfaceRenderer:()=>createSurfaceRenderer,Surface:()=>Surface,FuselageSurfaceRenderer:()=>FuselageSurfaceRenderer,renderTextObject:()=>renderTextObject});module.export({bannerParser:()=>bannerParser,messageParser:()=>messageParser,modalParser:()=>modalParser,contextualBarParser:()=>contextualBarParser,UiKitBanner:()=>UiKitBanner,UiKitMessage:()=>UiKitMessage,UiKitModal:()=>UiKitModal,UiKitContextualBar:()=>UiKitContextualBar},true);let BannerSurface;module.link('./BannerSurface',{default(v){BannerSurface=v}},0);let BannerSurfaceRenderer;module.link('./BannerSurfaceRenderer',{BannerSurfaceRenderer(v){BannerSurfaceRenderer=v}},1);let ContextualBarSurface;module.link('./ContextualBarSurface',{default(v){ContextualBarSurface=v}},2);let ContextualBarSurfaceRenderer;module.link('./ContextualBarSurfaceRenderer',{ContextualBarSurfaceRenderer(v){ContextualBarSurfaceRenderer=v}},3);let FuselageMessageSurfaceRenderer;module.link('./FuselageMessageSurfaceRenderer',{FuselageMessageSurfaceRenderer(v){FuselageMessageSurfaceRenderer=v}},4);let FuselageSurfaceRenderer,renderTextObject;module.link('./FuselageSurfaceRenderer',{FuselageSurfaceRenderer(v){FuselageSurfaceRenderer=v},renderTextObject(v){renderTextObject=v}},5);let MessageSurface;module.link('./MessageSurface',{default(v){MessageSurface=v}},6);let ModalSurface;module.link('./ModalSurface',{default(v){ModalSurface=v}},7);let ModalSurfaceRenderer;module.link('./ModalSurfaceRenderer',{ModalSurfaceRenderer(v){ModalSurfaceRenderer=v}},8);let Surface;module.link('./Surface',{Surface(v){Surface=v}},9);let createSurfaceRenderer;module.link('./createSurfaceRenderer',{createSurfaceRenderer(v){createSurfaceRenderer=v}},10);










const bannerParser = new BannerSurfaceRenderer();
const messageParser = new FuselageMessageSurfaceRenderer();
const modalParser = new ModalSurfaceRenderer();
const contextualBarParser = new ContextualBarSurfaceRenderer();
const UiKitBanner = createSurfaceRenderer(BannerSurface, bannerParser);
const UiKitMessage = createSurfaceRenderer(MessageSurface, messageParser);
const UiKitModal = createSurfaceRenderer(ModalSurface, modalParser);
const UiKitContextualBar = createSurfaceRenderer(ContextualBarSurface, contextualBarParser);

//# sourceMappingURL=index.js.map