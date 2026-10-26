// server/chunkedUpload.ts
import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import bodyParser from 'body-parser';
import { Mongo } from 'meteor/mongo';
import { Random } from '@rocket.chat/random';

// Collection to store assembled files
export const ChunkedFiles = new Mongo.Collection('chunked_files');

// In‑memory storage for incoming chunks (temporary, cleared after assembly)
const chunkBuffer: Record<string, { chunks: Buffer[]; totalChunks: number; received: number; filename: string; mime: string; userId: string }> = {};

Meteor.startup(() => {
  // Set memory limits
  const MAX_UPLOADS = 100;
  const MAX_CHUNK_SIZE = 100 * 1024 * 1024; // 100MB
  const TTL = 3600000; // 1 hour
  // Parse raw binary bodies for the chunked upload endpoint
  WebApp.connectHandlers.use('/api/v1/uploads/chunked', bodyParser.raw({ type: '*/*', limit: '200mb' }));

  // POST handler for receiving chunks
  WebApp.connectHandlers.use('/api/v1/uploads/chunked', (req, res, next) => {
    if (req.method !== 'POST') {
      return next();
    }

    const uploadId = req.headers['x-upload-id'] as string;
    const chunkIndexHeader = req.headers['x-chunk-index'] as string;
    const totalChunksHeader = req.headers['x-chunk-total'] as string;
    const filename = req.headers['x-filename'] as string || 'unknown';
    const mime = req.headers['content-type'] as string || 'application/octet-stream';

    if (!uploadId || !chunkIndexHeader || !totalChunksHeader) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, error: 'Missing required chunk headers' }));
    }

    const chunkIndex = parseInt(chunkIndexHeader, 10);
    const totalChunks = parseInt(totalChunksHeader, 10);
    const chunkData = req.body as Buffer;

    // Initialize buffer entry if first chunk
    if (!chunkBuffer[uploadId]) {
      chunkBuffer[uploadId] = { chunks: [], totalChunks, received: 0, filename, mime };
    }
    const entry = chunkBuffer[uploadId];
    entry.chunks[chunkIndex] = chunkData;
    entry.received += 1;

    // If all chunks received, assemble and store
    if (entry.received === entry.totalChunks) {
      const buffers: Buffer[] = [];
      for (let i = 0; i < entry.totalChunks; i++) {
        const buf = entry.chunks[i];
        if (!buf) {
          // Missing a chunk – should not happen
          res.writeHead(500, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ success: false, error: 'Incomplete chunk assembly' }));
        }
        buffers.push(buf);
      }
      const fileBuffer = Buffer.concat(buffers);
      const fileId = Random.id();
      ChunkedFiles.insert({
        _id: fileId,
        filename: entry.filename,
        mime: entry.mime,
        size: fileBuffer.length,
        data: fileBuffer,
        createdAt: new Date(),
      });
      // Cleanup temporary buffer
      delete chunkBuffer[uploadId];

      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true, fileId, filename: entry.filename, size: fileBuffer.length }));
    }

    // Chunk received but not complete yet
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ success: true, received: entry.received, total: entry.totalChunks }));
  });

  // GET handler to retrieve assembled file (base64 for simplicity)
  WebApp.connectHandlers.use('/api/v1/uploads/chunked/', (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }
    const parts = req.url?.split('/') || [];
    const fileId = parts[parts.length - 1];
    const file = ChunkedFiles.findOne({ _id: fileId });
    if (!file) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: false, error: 'File not found' }));
    }
    const base64 = file.data.toString('base64');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ success: true, fileId, filename: file.filename, mime: file.mime, size: file.size, data: base64 }));
  });
});
