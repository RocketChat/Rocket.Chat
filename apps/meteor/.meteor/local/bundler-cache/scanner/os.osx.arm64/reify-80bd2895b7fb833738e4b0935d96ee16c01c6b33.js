module.export({prettify:()=>prettify});let getTypedValue,getTypedContext;module.link("../../types.js",{getTypedValue(v){getTypedValue=v},getTypedContext(v){getTypedContext=v}},0);let suggest,formatSuggestions,formatBestSuggestion;module.link("../../suggest.js",{suggest(v){suggest=v},formatSuggestions(v){formatSuggestions=v},formatBestSuggestion(v){formatBestSuggestion=v}},1);let getValueByPath;module.link("../../json.js",{getValueByPath(v){getValueByPath=v}},2);


function prettify(context) {
    const { styleManager: { style, pathDescription, formatValue, formatTypedValue, }, printCode, dataPath, error: { params: { allowedValue, allowedValues } }, } = getTypedContext(context);
    const options = allowedValues !== null && allowedValues !== void 0 ? allowedValues : [allowedValue];
    const value = getValueByPath(context);
    const [prePath, pathExpr, postPath] = pathDescription(context, 'value');
    const suggestionResult = suggest(value, options, { referenceValue: value });
    const isConst = options.length === 1 &&
        (options[0] === null || typeof options[0] !== 'object');
    const title = style.title(`The ${prePath}`) +
        pathExpr +
        style.title(`${postPath} cannot be `) +
        formatValue(value) +
        formatSuggestions(suggestionResult, context, { isSuggestion: true, isConst });
    const codeFrame = printCode('replace this with ' +
        (isConst
            ? formatTypedValue(getTypedValue(options[0]))
            : ('an allowed value' +
                (!suggestionResult.best ? '' :
                    ' e.g. ' + formatBestSuggestion(suggestionResult, context)))), context.parsedJson, { path: dataPath.simplePath, markIdentifier: false });
    return { title, codeFrame };
}
