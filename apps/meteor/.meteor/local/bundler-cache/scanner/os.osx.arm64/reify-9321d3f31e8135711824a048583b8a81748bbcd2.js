module.export({prettify:()=>prettify});let getTypedContext;module.link("../../types.js",{getTypedContext(v){getTypedContext=v}},0);
function prettify(context) {
    const { styleManager: { style, pathDescription }, printCode, dataPath, error: { params: { pattern } }, } = getTypedContext(context);
    const [prePath, pathExpr, postPath] = pathDescription(context, 'string');
    const title = style.title(`The ${prePath}`) +
        pathExpr +
        style.title(`${postPath} must match `) +
        style.regex(pattern);
    const codeFrame = printCode('Ensure this matches the regex pattern', context.parsedJson, { path: dataPath.simplePath, markIdentifier: false });
    return { title, codeFrame };
}
