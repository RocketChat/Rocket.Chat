module.export({getLocation:()=>getLocation});let parsePath;module.link('./path.js',{parsePath(v){parsePath=v}},0);let getPosition;module.link('./position.js',{getPosition(v){getPosition=v}},1);

function getLocation(parsedJson, options) {
    const { jsonDoc, jsonString } = parsedJson;
    const { markIdentifier = false } = options;
    const path = parsePath(options).map(val => `${val}`);
    if (!jsonDoc) {
        // Minic null but undefined
        if (path.length === 0)
            // Found as root value
            return {
                start: { offset: 0, line: 1, column: 1 },
                end: { offset: 9, line: 1, column: 10 },
            };
        // Not found
        throw new Error(`No such path in undefined`);
    }
    const pathAsString = () => path.join('.');
    const getParentPath = (index) => '.' + path.slice(0, index).join('.');
    const explainWhere = (index) => `${getParentPath(index)} [query: ${pathAsString()}]`;
    const foundNode = path
        .reduce((node, pathItem, index) => (node === null || node === void 0 ? void 0 : node.kind) === 'object'
        ? (() => {
            const child = node.children.find(child => child.keyToken.value === pathItem);
            if (!child) {
                throw new Error(`No such property ${pathItem} in ` +
                    `${explainWhere(index)}`);
            }
            return markIdentifier && index === path.length - 1
                ? child
                : child.valueNode;
        })()
        : (node === null || node === void 0 ? void 0 : node.kind) === 'array'
            ? (() => {
                const itemIndex = Number(pathItem);
                if (isNaN(itemIndex)) {
                    throw new Error(`Invalid non-numeric array index "${pathItem}" ` +
                        `in array at ${explainWhere(index)}`);
                }
                else if (itemIndex < 0 || itemIndex >= node.children.length) {
                    throw new RangeError(`Index ${itemIndex} out-of-bounds in array of ` +
                        `size ${node.children.length} at ` +
                        `${explainWhere(index)}`);
                }
                return node.children[Number(pathItem)].valueNode;
            })()
            : (() => {
                throw new Error(`No such property ${pathItem} in ` +
                    `${explainWhere(index)}`);
            })(), jsonDoc.root);
    const range = foundNode.kind === 'object-property'
        ? {
            start: foundNode.keyToken.offset,
            end: foundNode.keyToken.offset + foundNode.keyToken.raw.length,
        }
        : foundNode.range;
    return {
        start: getPosition(jsonString, range.start),
        end: getPosition(jsonString, range.end),
    };
}
