let _jsx,_jsxs;module.link("react/jsx-runtime",{jsx(v){_jsx=v},jsxs(v){_jsxs=v}},0);let Box,Icon,Tag;module.link('@rocket.chat/fuselage',{Box(v){Box=v},Icon(v){Icon=v},Tag(v){Tag=v}},1);

const MessageComposerHint = ({ icon, children, helperText }) => (_jsxs(Box, { pbs: 0, pbe: 4, display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', children: [_jsx(Tag, { icon: icon ? _jsx(Icon, { mie: 4, name: icon, size: 'x12' }) : undefined, children: children }), helperText && (_jsx(Box, { fontScale: 'c1', color: 'font-hint', children: helperText }))] }));
module.exportDefault(MessageComposerHint);
//# sourceMappingURL=MessageComposerHint.js.map