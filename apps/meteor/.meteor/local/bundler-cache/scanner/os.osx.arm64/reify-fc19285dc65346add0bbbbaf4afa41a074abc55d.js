module.export({prettify:()=>prettify});let getTypedValue,getTypedContext;module.link("../../types.js",{getTypedValue(v){getTypedValue=v},getTypedContext(v){getTypedContext=v}},0);let suggestTypedValue,formatSuggestions;module.link("../../suggest.js",{suggestTypedValue(v){suggestTypedValue=v},formatSuggestions(v){formatSuggestions=v}},1);let getValueByPath;module.link("../../json.js",{getValueByPath(v){getValueByPath=v}},2);


function prettify(context) {
    const { styleManager: { style, pathDescription }, printCode, dataPath, error: { keyword, typeErrors = [] }, } = getTypedContext(context);
    const [prePath, pathExpr, postPath] = pathDescription(context, 'value');
    const value = getValueByPath(context);
    const allowedTypes = typeErrors.map(typeError => typeError.params.type);
    const suggestion = suggestTypedValue(value, allowedTypes, context);
    const instead = typeErrors.length === 0
        ? 'unknown'
        : formatSuggestions(allowedTypes.map(value => ({
            value,
            type: 'string',
            isSimple: true,
        })), context, { untyped: true });
    const title = style.title(`The type of the ${prePath}`) +
        pathExpr +
        style.title(`${postPath} should `) +
        (keyword === 'not'
            ?
                style.title('NOT be ') +
                    style.pathDescription(getTypedValue(value).type)
            :
                style.title(`be `) + instead);
    const codeFrame = printCode(keyword === 'not'
        ? 'change this type'
        : `change this value` +
            (!suggestion ? '' :
                ' to ' + suggestion.value +
                    ' (as ' + style.pathDescription(suggestion.type) +
                    ') perhaps?'), context.parsedJson, { path: dataPath.simplePath, markIdentifier: false });
    return { title, codeFrame };
}
