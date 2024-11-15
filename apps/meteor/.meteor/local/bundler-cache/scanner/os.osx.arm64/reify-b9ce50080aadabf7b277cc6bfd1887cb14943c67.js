module.export({prettify:()=>prettify});let getTypedContext;module.link("../../types.js",{getTypedContext(v){getTypedContext=v}},0);let getValueByPath;module.link("../../json.js",{getValueByPath(v){getValueByPath=v}},1);

function prettify(context) {
    const { styleManager: { style, pathDescription, formatValue }, printCode, dataPath, error: { params: { i, j } }, } = getTypedContext(context);
    const [a, b] = [i, j].sort();
    const valueA = getValueByPath(context, [...dataPath.simplePath, `${a}`]);
    const [prePath, pathExpr, postPath] = pathDescription(context, 'array');
    const title = style.title(`The ${prePath}`) +
        pathExpr +
        style.title(`${postPath} should have unique items, but element `) +
        style.number(`${a}`) +
        style.title(" and ") +
        style.number(`${b}`) +
        style.title(" are identical: ") +
        formatValue(valueA);
    const codeFrame = printCode('Remove element ' +
        style.number(`${a}`) +
        ' or ' +
        style.number(`${b}`), context.parsedJson, { path: dataPath.simplePath, markIdentifier: false });
    return { title, codeFrame };
}
