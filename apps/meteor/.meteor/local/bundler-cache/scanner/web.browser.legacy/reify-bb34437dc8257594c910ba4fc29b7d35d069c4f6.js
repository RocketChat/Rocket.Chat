var _jsx,_jsxs;module.link("react/jsx-runtime",{jsx:function(v){_jsx=v},jsxs:function(v){_jsxs=v}},0);var Box,Icon,Tag;module.link('@rocket.chat/fuselage',{Box:function(v){Box=v},Icon:function(v){Icon=v},Tag:function(v){Tag=v}},1);

const MessageComposerHint = ({ icon, children, helperText }) => (_jsxs(Box, { pbs: 0, pbe: 4, display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', children: [_jsx(Tag, { icon: icon ? _jsx(Icon, { mie: 4, name: icon, size: 'x12' }) : undefined, children: children }), helperText && (_jsx(Box, { fontScale: 'c1', color: 'font-hint', children: helperText }))] }));
module.exportDefault(MessageComposerHint);
//# sourceMappingURL=MessageComposerHint.js.map