let _jsx,_jsxs;module.link("react/jsx-runtime",{jsx(v){_jsx=v},jsxs(v){_jsxs=v}},0);let Box,Skeleton;module.link('@rocket.chat/fuselage',{Box(v){Box=v},Skeleton(v){Skeleton=v}},1);let UiKit;module.link('@rocket.chat/ui-kit',{"*"(v){UiKit=v}},2);let memo,useEffect,useState;module.link('react',{memo(v){memo=v},useEffect(v){useEffect=v},useState(v){useState=v}},3);let Image;module.link('./ImageBlock.styles',{Image(v){Image=v}},4);let useSurfaceType;module.link('../hooks/useSurfaceType',{useSurfaceType(v){useSurfaceType=v}},5);





const maxSize = 360;
const fetchImageState = (img) => {
    if (!img.complete) {
        return {
            loading: true,
            width: maxSize,
            height: (maxSize * 9) / 21,
        };
    }
    const { naturalWidth, naturalHeight } = img;
    const scaleRatio = naturalWidth > naturalHeight
        ? Math.min(naturalWidth, maxSize) / naturalWidth
        : Math.min(naturalHeight, maxSize) / naturalHeight;
    return {
        loading: false,
        width: naturalWidth * scaleRatio,
        height: naturalHeight * scaleRatio,
    };
};
const ImageBlock = ({ className, block, surfaceRenderer, }) => {
    const surface = useSurfaceType();
    const alignment = surface === 'banner' || surface === 'message' ? 'flex-start' : 'center';
    const [{ loading, width, height }, setState] = useState(() => {
        const img = document.createElement('img');
        img.src = block.imageUrl;
        return fetchImageState(img);
    });
    useEffect(() => {
        const img = document.createElement('img');
        const handleLoad = () => {
            setState(fetchImageState(img));
        };
        img.addEventListener('load', handleLoad);
        img.src = block.imageUrl;
        if (img.complete) {
            img.removeEventListener('load', handleLoad);
            setState(fetchImageState(img));
        }
        return () => {
            img.removeEventListener('load', handleLoad);
        };
    }, [block.imageUrl]);
    return (_jsx(Box, { className: className, display: 'flex', flexDirection: 'column', flexWrap: 'nowrap', alignItems: alignment, children: _jsxs(Box, { overflow: 'hidden', width: width, children: [block.title && (_jsx(Box, { fontScale: 'c1', color: 'hint', withTruncatedText: true, marginBlockEnd: 4, children: surfaceRenderer.renderTextObject(block.title, 0, UiKit.BlockContext.NONE) })), loading ? (_jsx(Skeleton, { variant: 'rect', width: width, height: height })) : (_jsx(Image, { imageUrl: block.imageUrl, width: width, height: height, "aria-label": block.altText }))] }) }));
};
module.exportDefault(memo(ImageBlock));
//# sourceMappingURL=ImageBlock.js.map