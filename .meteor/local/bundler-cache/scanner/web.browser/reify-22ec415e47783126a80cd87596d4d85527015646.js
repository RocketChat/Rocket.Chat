let Box,Skeleton;module.link('@rocket.chat/fuselage',{Box(v){Box=v},Skeleton(v){Skeleton=v}},0);let UiKit;module.link('@rocket.chat/ui-kit',{"*"(v){UiKit=v}},1);let React,memo,useEffect,useState;module.link('react',{default(v){React=v},memo(v){memo=v},useEffect(v){useEffect=v},useState(v){useState=v}},2);let useSurfaceType;module.link('../contexts/SurfaceContext',{useSurfaceType(v){useSurfaceType=v}},3);let Image;module.link('./ImageBlock.styles',{Image(v){Image=v}},4);




var maxSize = 360;
var fetchImageState = function (img) {
    if (!img.complete) {
        return {
            loading: true,
            width: maxSize,
            height: (maxSize * 9) / 21,
        };
    }
    var naturalWidth = img.naturalWidth, naturalHeight = img.naturalHeight;
    var scaleRatio = naturalWidth > naturalHeight
        ? Math.min(naturalWidth, maxSize) / naturalWidth
        : Math.min(naturalHeight, maxSize) / naturalHeight;
    return {
        loading: false,
        width: naturalWidth * scaleRatio,
        height: naturalHeight * scaleRatio,
    };
};
var ImageBlock = function (_a) {
    var className = _a.className, block = _a.block, surfaceRenderer = _a.surfaceRenderer;
    var surface = useSurfaceType();
    var alignment = surface === 'banner' || surface === 'message' ? 'flex-start' : 'center';
    var _b = useState(function () {
        var img = document.createElement('img');
        img.src = block.imageUrl;
        return fetchImageState(img);
    }), _c = _b[0], loading = _c.loading, width = _c.width, height = _c.height, setState = _b[1];
    useEffect(function () {
        var img = document.createElement('img');
        var handleLoad = function () {
            setState(fetchImageState(img));
        };
        img.addEventListener('load', handleLoad);
        img.src = block.imageUrl;
        if (img.complete) {
            img.removeEventListener('load', handleLoad);
            setState(fetchImageState(img));
        }
        return function () {
            img.removeEventListener('load', handleLoad);
        };
    }, [block.imageUrl]);
    return (React.createElement(Box, { className: className, display: 'flex', flexDirection: 'column', flexWrap: 'nowrap', alignItems: alignment },
        React.createElement(Box, { overflow: 'hidden', width: width },
            block.title && (React.createElement(Box, { fontScale: 'c1', color: 'info', withTruncatedText: true, marginBlockEnd: 4 }, surfaceRenderer.renderTextObject(block.title, 0, UiKit.BlockContext.NONE))),
            loading ? (React.createElement(Skeleton, { variant: 'rect', width: width, height: height })) : (React.createElement(Image, { imageUrl: block.imageUrl, width: width, height: height, "aria-label": block.altText })))));
};
module.exportDefault(memo(ImageBlock));
//# sourceMappingURL=ImageBlock.js.map