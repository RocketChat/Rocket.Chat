module.export({makeManager:()=>makeManager});let getTypedValue;module.link("../types.js",{getTypedValue(v){getTypedValue=v}},0);let enquote;module.link("../util.js",{enquote(v){enquote=v}},1);

function makeManager({ support, style, terminalLink }) {
    const link = (title, url) => {
        return terminalLink(style.link(title), url);
    };
    const ensureColorUsage = useColors => {
        return useColors == null ? support : useColors;
    };
    const formatDataPath = (dataPath) => {
        return dataPath.path
            .map(({ key, type }) => type === 'number'
            ?
                style.operator('[') +
                    style.number(key) +
                    style.operator(']')
            :
                style.operator('.') +
                    style.string(key))
            .join('');
    };
    const pathDescription = (context, pathType) => {
        const { dataPath } = context;
        if (dataPath.path.length === 0)
            return ['', style.expr("root object"), ''];
        const humanify = (dataPath) => dataPath.path.length === 1
            ? ['', formatDataPath(dataPath, context), ` ${pathType}`]
            : [`${pathType} at `, formatDataPath(dataPath, context), ''];
        return humanify(dataPath);
    };
    const printEnum = (lines, { indent = 0, bullet = true } = {}) => {
        const prefix = indent === 0 ? '' : ' '.repeat(indent);
        const bulletChar = bullet ? '∙ ' : '';
        return lines.map(line => `${prefix}    ${bulletChar}${line}`);
    };
    const printError = result => {
        return result.title + "\n\n" + result.codeFrame;
    };
    const formatTypedValue = (typedValue, { untyped = false, includeType = false } = {}) => {
        const type = typedValue.type;
        const value = `${typedValue.value}`;
        const styledValue = type === 'string'
            ? untyped
                ? style.pathDescription(value)
                : style.string(enquote(value))
            : type === 'number'
                ? style.number(value)
                : style.primitive(value);
        if (!includeType && typedValue.isSimple)
            return styledValue;
        return styledValue +
            style.title(' (as ') +
            style.pathDescription(type) +
            style.title(')');
    };
    const formatValue = (value, opts) => {
        return formatTypedValue(getTypedValue(value), opts);
    };
    return {
        support,
        style,
        link,
        ensureColorUsage,
        formatDataPath,
        pathDescription,
        printEnum,
        printError,
        formatTypedValue,
        formatValue,
    };
}
