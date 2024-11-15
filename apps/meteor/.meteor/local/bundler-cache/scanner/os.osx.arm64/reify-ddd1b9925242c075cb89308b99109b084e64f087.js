module.export({parsePath:()=>parsePath,parseJsonPointerPath:()=>parseJsonPointerPath,parseJsonPointerSegment:()=>parseJsonPointerSegment,encodeJsonPointerPath:()=>encodeJsonPointerPath,encodeJsonPointerSegment:()=>encodeJsonPointerSegment});function parsePath(path) {
    const pathAsPath = path;
    const pathAsDotPath = path;
    const pathAsPointerPath = path;
    if (pathAsPath.path && Array.isArray(pathAsPath.path))
        return pathAsPath.path;
    else if (typeof pathAsDotPath.dotPath === 'string')
        return parseDotPath(pathAsDotPath.dotPath);
    else if (typeof pathAsPointerPath.pointerPath === 'string')
        return parseJsonPointerPath(pathAsPointerPath.pointerPath);
    throw new TypeError(`parsePath(): Missing path argument`);
}
function parseDotPath(path) {
    if (!path.startsWith('.') && !path.startsWith('['))
        throw new SyntaxError('parsePath(): Invalid dot-path, must begin with "." or "[": ' +
            `${path}`);
    if (path === '.')
        return [];
    const bail = () => {
        throw new Error(`parsePath(): Invalid dot-path: ${path}`);
    };
    const ret = [];
    const nearest = (a, b) => a === -1 && b === -1 ? -1
        : a === -1 ? b
            : b === -1 ? a
                : a < b ? a : b;
    let pos = 0;
    while (pos !== -1 && pos < path.length) {
        if (path.charAt(pos) === '.') {
            if (path.charAt(pos + 1) === "'") {
                const lastPos = path.indexOf("'", pos + 2);
                if (lastPos === -1)
                    bail();
                ret.push(path.slice(pos + 2, lastPos));
                pos = lastPos + 1;
            }
            else {
                const posOfDot = path.indexOf('.', pos + 1);
                const posOfBracket = path.indexOf('[', pos + 1);
                const lastPos = nearest(posOfDot, posOfBracket);
                ret.push(lastPos === -1
                    ? path.slice(pos + 1)
                    : path.slice(pos + 1, lastPos));
                pos = lastPos;
            }
        }
        else // ['segment name'] or [number] form
         {
            if (path.charAt(pos + 1).match(/[0-9]/)) {
                const lastPos = path.indexOf("]", pos + 1);
                if (lastPos === -1)
                    bail();
                ret.push(path.slice(pos + 1, lastPos));
                pos = lastPos + 1;
            }
            else {
                if (path.charAt(pos + 1) !== "'")
                    bail();
                const lastPos = path.indexOf("']", pos + 2);
                if (lastPos === -1)
                    bail();
                ret.push(path.slice(pos + 2, lastPos));
                pos = lastPos + 2;
            }
        }
    }
    return ret;
}
function parseJsonPointerPath(path) {
    if (!path.startsWith('/'))
        throw new SyntaxError(`parsePath(): Invalid pointer-path, must begin with "/": ${path}`);
    if (path === '/')
        return [];
    return path
        .slice(1)
        .split('/')
        .map(segment => parseJsonPointerSegment(segment));
}
function parseJsonPointerSegment(segment) {
    return segment.replace(/~1/g, '/').replace(/~0/g, '~');
}
function encodeJsonPointerPath(path) {
    return '/' + path
        .map(segment => encodeJsonPointerSegment(segment))
        .join('/');
}
function encodeJsonPointerSegment(segment) {
    return `${segment}`.replace(/~/g, '~0').replace(/\//g, '~1');
}
