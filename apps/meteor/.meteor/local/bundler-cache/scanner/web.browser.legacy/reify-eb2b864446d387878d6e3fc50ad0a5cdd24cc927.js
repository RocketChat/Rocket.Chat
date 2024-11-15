var _jsx,_jsxs;module.link("react/jsx-runtime",{jsx:function(v){_jsx=v},jsxs:function(v){_jsxs=v}},0);var Skeleton;module.link('@rocket.chat/fuselage',{Skeleton:function(v){Skeleton=v}},1);var VideoConfMessage;module.link('./VideoConfMessage',{default:function(v){VideoConfMessage=v}},2);var VideoConfMessageRow;module.link('./VideoConfMessageRow',{default:function(v){VideoConfMessageRow=v}},3);



const VideoConfMessageSkeleton = (props) => (_jsxs(VideoConfMessage, Object.assign({}, props, { children: [_jsx(VideoConfMessageRow, { children: _jsx(Skeleton, { width: 'full', pb: 4 }) }), _jsx(VideoConfMessageRow, { backgroundColor: 'tint', children: _jsx(Skeleton, { width: 'full', pb: 4 }) })] })));
module.exportDefault(VideoConfMessageSkeleton);
//# sourceMappingURL=VideoConfMessageSkeleton.js.map