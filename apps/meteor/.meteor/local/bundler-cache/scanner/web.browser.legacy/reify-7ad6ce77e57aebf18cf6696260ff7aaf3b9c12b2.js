var _jsx;module.link("react/jsx-runtime",{jsx:function(v){_jsx=v}},0);var colors;module.link('@rocket.chat/fuselage-tokens/colors.json',{default:function(v){colors=v}},1);var styled;module.link('@rocket.chat/styled',{default:function(v){styled=v}},2);var useState;module.link('react',{useState:function(v){useState=v}},3);var ErrorBoundary;module.link('react-error-boundary',{ErrorBoundary:function(v){ErrorBoundary=v}},4);




const Fallback = styled('span') `
	text-decoration: underline;
	text-decoration-color: ${colors.r400};
`;
const KatexErrorBoundary = ({ children, code }) => {
    const [error, setError] = useState(null);
    return _jsx(ErrorBoundary, { children: children, onError: setError, fallback: _jsx(Fallback, { title: error === null || error === void 0 ? void 0 : error.message, children: code }) });
};
module.exportDefault(KatexErrorBoundary);
//# sourceMappingURL=KatexErrorBoundary.js.map