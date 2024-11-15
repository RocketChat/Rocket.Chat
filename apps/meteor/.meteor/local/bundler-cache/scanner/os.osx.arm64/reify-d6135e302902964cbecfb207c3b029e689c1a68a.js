module.export({prettify:()=>prettify});let getTypedContext;module.link("../../types.js",{getTypedContext(v){getTypedContext=v}},0);
function prettify(context) {
    const { styleManager: { style, pathDescription }, printCode, dataPath, error: { params: { multipleOf } }, } = getTypedContext(context);
    const [prePath, pathExpr, postPath] = pathDescription(context, 'value');
    const validStatement = style.title(`multiple of `) +
        style.number(`${multipleOf}`);
    const title = style.title(`The ${prePath}`) +
        pathExpr +
        style.title(`${postPath} should be a `) +
        validStatement + ' ' +
        style.title('(e.g. ') +
        [0, 1, 2, 3]
            .map(mul => style.number(`${mul * multipleOf}`))
            .concat([style.title('etc')])
            .join(style.operator(', ')) +
        style.title(')');
    const codeFrame = printCode('Ensure this is a ' + validStatement, context.parsedJson, { path: dataPath.simplePath, markIdentifier: false });
    return { title, codeFrame };
}
