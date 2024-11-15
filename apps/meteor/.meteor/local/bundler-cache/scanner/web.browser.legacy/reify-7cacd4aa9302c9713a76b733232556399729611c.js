var _jsx;module.link("react/jsx-runtime",{jsx:function(v){_jsx=v}},0);var css;module.link('@rocket.chat/css-in-js',{css:function(v){css=v}},1);var Box,Badge;module.link('@rocket.chat/fuselage',{Box:function(v){Box=v},Badge:function(v){Badge=v}},2);


const HeaderToolbarActionActionBadge = (props) => (_jsx(Box, { position: 'absolute', role: 'status', className: css `
			top: 0;
			right: 0;
			transform: translate(30%, -30%);
			z-index: 1;
		`, children: _jsx(Badge, Object.assign({}, props)) }));
module.exportDefault(HeaderToolbarActionActionBadge);
//# sourceMappingURL=HeaderToolbarActionBadge.js.map