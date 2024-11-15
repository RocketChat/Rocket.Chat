let _jsx;module.link("react/jsx-runtime",{jsx(v){_jsx=v}},0);let css;module.link('@rocket.chat/css-in-js',{css(v){css=v}},1);let Box,Badge;module.link('@rocket.chat/fuselage',{Box(v){Box=v},Badge(v){Badge=v}},2);


const HeaderToolbarActionBadge = (props) => (_jsx(Box, { position: 'absolute', role: 'status', className: css `
			top: 0;
			right: 0;
			transform: translate(30%, -30%);
			z-index: 1;
		`, children: _jsx(Badge, Object.assign({}, props)) }));
module.exportDefault(HeaderToolbarActionBadge);
//# sourceMappingURL=HeaderToolbarActionBadge.js.map