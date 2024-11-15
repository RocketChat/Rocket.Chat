module.export({prettify:()=>prettify});let getTypedContext;module.link("../../types.js",{getTypedContext(v){getTypedContext=v}},0);
function prettify(context) {
    const { styleManager: { style, pathDescription }, printCode, dataPath, error: { params: { missingProperty } }, } = getTypedContext(context);
    const [prePath, pathExpr, postPath] = pathDescription(context, 'value');
    const title = style.title(`The ${prePath}`) +
        pathExpr +
        style.title(`${postPath} is missing required property `) +
        style.pathDescription(missingProperty);
    const codeFrame = printCode('add missing property ' +
        style.pathDescription(missingProperty), context.parsedJson, { path: dataPath.simplePath, markIdentifier: false });
    return { title, codeFrame };
}
