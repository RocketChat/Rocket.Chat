"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.streamToBuffer = void 0;
const streamToBuffer = (stream) => new Promise((resolve, reject) => {
    const chunks = [];
    stream
        .on('data', (data) => chunks.push(data))
        .on('end', () => resolve(Buffer.concat(chunks)))
        .on('error', (error) => reject(error))
        // force stream to resume data flow in case it was explicitly paused before
        .resume();
});
exports.streamToBuffer = streamToBuffer;
//# sourceMappingURL=stream.js.map