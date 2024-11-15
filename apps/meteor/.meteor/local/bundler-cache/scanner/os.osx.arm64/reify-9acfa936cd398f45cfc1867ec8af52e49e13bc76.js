module.export({prettify:()=>prettify});let suggestAnotherType,getTypedContext;module.link("../../types.js",{suggestAnotherType(v){suggestAnotherType=v},getTypedContext(v){getTypedContext=v}},0);let getValueByPath;module.link("../../json.js",{getValueByPath(v){getValueByPath=v}},1);

function prettify(context) {
    const { styleManager: { style, pathDescription, formatTypedValue }, printCode, dataPath, error: { params: { type } }, } = getTypedContext(context);
    const value = getValueByPath(context);
    const [prePath, pathExpr, postPath] = pathDescription(context, 'value');
    const suggestionValue = suggestAnotherType(value, type);
    const suggestion = suggestionValue === undefined
        ? ''
        : formatTypedValue(suggestionValue, { includeType: true });
    const title = style.title(`The type of the ${prePath}`) +
        pathExpr +
        style.title(`${postPath} should be `) +
        style.pathDescription(type) +
        (suggestion ? style.title(', e.g. ') + suggestion : '');
    const codeFrame = printCode('Replace this' +
        (suggestion
            ? ' with e.g. ' + suggestion
            : ''), context.parsedJson, { path: dataPath.simplePath, markIdentifier: false });
    return { title, codeFrame };
}
