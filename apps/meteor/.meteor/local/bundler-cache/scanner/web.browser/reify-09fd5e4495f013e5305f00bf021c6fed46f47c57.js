let _jsx,_jsxs;module.link("react/jsx-runtime",{jsx(v){_jsx=v},jsxs(v){_jsxs=v}},0);let Box;module.link('@rocket.chat/fuselage',{Box(v){Box=v}},1);let useLayout;module.link('@rocket.chat/ui-contexts',{useLayout(v){useLayout=v}},2);let HeaderDivider;module.link('./HeaderDivider',{default(v){HeaderDivider=v}},3);



const Header = (props) => {
    const { isMobile } = useLayout();
    return (_jsxs(Box, { "rcx-room-header": true, is: 'header', height: 'x64', display: 'flex', justifyContent: 'center', flexDirection: 'column', overflow: 'hidden', flexShrink: 0, children: [_jsx(Box, Object.assign({ height: 'x64', mi: 'neg-x4', pi: isMobile ? 'x12' : 'x24', display: 'flex', flexGrow: 1, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', flexDirection: 'row' }, props)), _jsx(HeaderDivider, {})] }));
};
module.exportDefault(Header);
//# sourceMappingURL=Header.js.map