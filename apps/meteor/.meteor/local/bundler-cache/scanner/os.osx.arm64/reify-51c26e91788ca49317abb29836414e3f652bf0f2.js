module.export({prettify:()=>prettify});let getTypedContext;module.link("../../types.js",{getTypedContext(v){getTypedContext=v}},0);
function prettify(context) {
    const { styleManager: { style, pathDescription }, printCode, dataPath, error: { params: { comparison, limit } }, } = getTypedContext(context);
    const [prePath, pathExpr, postPath] = pathDescription(context, 'value');
    const compHuman = comparison === '<='
        ? style.expr("less than or equal to")
        : comparison === '<'
            ? style.expr("strictly less than")
            : comparison === '>='
                ? style.expr("greater than or equal to")
                : comparison === '>'
                    ? style.expr("strictly greater than")
                    : style.operator(`${comparison}`);
    const validStatement = compHuman +
        style.number(` ${limit}`);
    const title = style.title(`The ${prePath}`) +
        pathExpr +
        style.title(`${postPath} should be `) +
        validStatement;
    const codeFrame = printCode('Ensure this is ' + validStatement, context.parsedJson, { path: dataPath.simplePath, markIdentifier: false });
    return { title, codeFrame };
}
