module.export({bannerParser:()=>bannerParser,messageParser:()=>messageParser,modalParser:()=>modalParser,UiKitBanner:()=>UiKitBanner,UiKitMessage:()=>UiKitMessage,UiKitModal:()=>UiKitModal});let BannerSurface;module.link('./BannerSurface',{default(v){BannerSurface=v}},0);let FuselageSurfaceRenderer;module.link('./FuselageSurfaceRenderer',{FuselageSurfaceRenderer(v){FuselageSurfaceRenderer=v}},1);let MessageSurface;module.link('./MessageSurface',{default(v){MessageSurface=v}},2);let ModalSurface;module.link('./ModalSurface',{default(v){ModalSurface=v}},3);let createSurfaceRenderer;module.link('./createSurfaceRenderer',{createSurfaceRenderer(v){createSurfaceRenderer=v}},4);




// export const attachmentParser = new FuselageSurfaceRenderer();
var bannerParser = new FuselageSurfaceRenderer();
var messageParser = new FuselageSurfaceRenderer();
var modalParser = new FuselageSurfaceRenderer();
// export const UiKitAttachment = createSurfaceRenderer(AttachmentSurface, attachmentParser);
var UiKitBanner = createSurfaceRenderer(BannerSurface, bannerParser);
var UiKitMessage = createSurfaceRenderer(MessageSurface, messageParser);
var UiKitModal = createSurfaceRenderer(ModalSurface, modalParser);
//# sourceMappingURL=index.js.map