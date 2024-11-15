var _jsx,_jsxs;module.link("react/jsx-runtime",{jsx:function(v){_jsx=v},jsxs:function(v){_jsxs=v}},0);var Box;module.link('@rocket.chat/fuselage',{Box:function(v){Box=v}},1);var useLayout;module.link('@rocket.chat/ui-contexts',{useLayout:function(v){useLayout=v}},2);var HeaderDivider;module.link('./HeaderDivider',{default:function(v){HeaderDivider=v}},3);



const Header = (props) => {
    const { isMobile } = useLayout();
    return (_jsxs(Box, { "rcx-room-header": true, is: 'header', display: 'flex', justifyContent: 'center', flexDirection: 'column', overflow: 'hidden', flexShrink: 0, children: [_jsx(Box, Object.assign({ pi: isMobile ? 'x12' : 'x24', height: 'x44', display: 'flex', flexGrow: 1, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', flexDirection: 'row', bg: 'room' }, props)), _jsx(HeaderDivider, {})] }));
};
module.exportDefault(Header);
//# sourceMappingURL=Header.js.map