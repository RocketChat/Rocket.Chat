module.export({prettify:()=>prettify});let getTypedContext;module.link("../../types.js",{getTypedContext(v){getTypedContext=v}},0);
function prettify(context) {
    const { styleManager: { style, pathDescription }, printCode, dataPath, error: { keyword, params: { limit } }, } = getTypedContext(context);
    const [prePath, pathExpr, postPath] = pathDescription(context, 'string');
    const limitOperation = keyword === 'maxLength'
        ? style.expr('at most')
        : keyword === 'minLength'
            ? style.expr('at least')
            : '{unknown}';
    const validStatement = `${limitOperation} ` +
        style.number(`${limit}`) +
        style.expr(' characters long');
    const title = style.title(`The ${prePath}`) +
        pathExpr +
        style.title(`${postPath} should be `) +
        validStatement;
    const codeFrame = printCode('Ensure this is ' + validStatement, context.parsedJson, { path: dataPath.simplePath, markIdentifier: false });
    return { title, codeFrame };
}
