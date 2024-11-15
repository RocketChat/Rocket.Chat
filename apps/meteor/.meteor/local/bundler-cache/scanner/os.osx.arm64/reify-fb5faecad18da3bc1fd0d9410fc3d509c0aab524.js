module.export({getValueByPath:()=>getValueByPath});let pointer;module.link('jsonpointer',{"*"(v){pointer=v}},0);
function getValueByPath(context, path = context.dataPath.simplePath) {
    if (context.data === null || typeof context.data !== 'object')
        return context.data;
    return pointer.get(context.data, encodeJsonPointerPath(path));
}
function encodeJsonPointerPath(path) {
    return '/' +
        path
            .map(segment => encodeJsonPointerSegment(segment))
            .join('/');
}
function encodeJsonPointerSegment(segment) {
    return segment.replace(/~/g, '~0').replace(/\//g, '~1');
}
