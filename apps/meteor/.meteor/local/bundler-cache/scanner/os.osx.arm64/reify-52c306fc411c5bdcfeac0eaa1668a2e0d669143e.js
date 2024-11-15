module.export({prettify:()=>prettify});let getTypedContext;module.link("../../types.js",{getTypedContext(v){getTypedContext=v}},0);let suggest,formatSuggestions;module.link("../../suggest.js",{suggest(v){suggest=v},formatSuggestions(v){formatSuggestions=v}},1);let getPossibleProperties;module.link("../../schema.js",{getPossibleProperties(v){getPossibleProperties=v}},2);


function prettify(context) {
    const { styleManager: { style, pathDescription }, printCode, dataPath, error: { params: { additionalProperty } }, } = getTypedContext(context);
    const [prePath, pathExpr, postPath] = pathDescription(context, 'object');
    const possibles = getPossibleProperties(context.schema, dataPath);
    const title = style.title(`The ${prePath}`) +
        pathExpr +
        style.title(`${postPath} should not have the property `) +
        style.pathDescription(additionalProperty) +
        formatSuggestions(suggest(additionalProperty, possibles), context, { untyped: true, isSuggestion: true });
    const codeFrame = printCode('remove or rename ' +
        style.pathDescription(`"${additionalProperty}"`), context.parsedJson, {
        path: [...dataPath.simplePath, additionalProperty],
        markIdentifier: true,
    });
    return { title, codeFrame };
}
