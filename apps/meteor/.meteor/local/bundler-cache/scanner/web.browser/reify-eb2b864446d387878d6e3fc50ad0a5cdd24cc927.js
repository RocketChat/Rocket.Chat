let _jsx,_jsxs;module.link("react/jsx-runtime",{jsx(v){_jsx=v},jsxs(v){_jsxs=v}},0);let Skeleton;module.link('@rocket.chat/fuselage',{Skeleton(v){Skeleton=v}},1);let VideoConfMessage;module.link('./VideoConfMessage',{default(v){VideoConfMessage=v}},2);let VideoConfMessageRow;module.link('./VideoConfMessageRow',{default(v){VideoConfMessageRow=v}},3);



const VideoConfMessageSkeleton = (props) => (_jsxs(VideoConfMessage, Object.assign({}, props, { children: [_jsx(VideoConfMessageRow, { children: _jsx(Skeleton, { width: 'full', pb: 4 }) }), _jsx(VideoConfMessageRow, { backgroundColor: 'tint', children: _jsx(Skeleton, { width: 'full', pb: 4 }) })] })));
module.exportDefault(VideoConfMessageSkeleton);
//# sourceMappingURL=VideoConfMessageSkeleton.js.map