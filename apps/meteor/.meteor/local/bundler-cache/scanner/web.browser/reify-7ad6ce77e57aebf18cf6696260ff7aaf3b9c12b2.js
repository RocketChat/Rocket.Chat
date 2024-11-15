let _jsx;module.link("react/jsx-runtime",{jsx(v){_jsx=v}},0);let colors;module.link('@rocket.chat/fuselage-tokens/colors.json',{default(v){colors=v}},1);let styled;module.link('@rocket.chat/styled',{default(v){styled=v}},2);let useState;module.link('react',{useState(v){useState=v}},3);let ErrorBoundary;module.link('react-error-boundary',{ErrorBoundary(v){ErrorBoundary=v}},4);




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