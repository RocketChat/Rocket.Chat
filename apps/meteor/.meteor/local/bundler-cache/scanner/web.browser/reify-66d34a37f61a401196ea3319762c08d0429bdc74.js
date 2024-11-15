"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useStream = useStream;
const react_1 = require("react");
const ServerContext_1 = require("../ServerContext");
function useStream(streamName, options) {
    const { getStream } = (0, react_1.useContext)(ServerContext_1.ServerContext);
    return (0, react_1.useMemo)(() => getStream(streamName, options), [getStream, streamName, options]);
}
//# sourceMappingURL=useStream.js.map