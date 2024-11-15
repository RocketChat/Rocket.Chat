module.export({parseDataPath:()=>parseDataPath});let parsePath;module.link('jsonpos',{parsePath(v){parsePath=v}},0);
function parseDataPath(error) {
    // Ajv 6 and 7 differ. In 6 the dataPath separator is `.`, in 7 it's `/`.
    // The dot-form may also use brackets: ['foo'].bar for /foo/bar
    // Since Ajv 8, it's called "instancePath"
    var _a;
    if (!((_a = error.dataPath) !== null && _a !== void 0 ? _a : error.instancePath))
        return { path: [], simplePath: [] };
    const isDotPath = (path) => path.charAt(0) === '.' || path.charAt(0) === '[';
    const value = !!error.instancePath
        ? parsePath({ pointerPath: error.instancePath })
        : isDotPath(error.dataPath)
            ? parsePath({ dotPath: error.dataPath })
            : parsePath({ pointerPath: error.dataPath });
    const path = value
        .map((entry) => typeof entry === 'number'
        ? ({ key: `${entry}`, type: 'number' })
        : ({ key: entry, type: 'string' }))
        .filter(val => val.key !== '');
    const simplePath = path.map(({ key }) => key);
    return { path, simplePath };
}
