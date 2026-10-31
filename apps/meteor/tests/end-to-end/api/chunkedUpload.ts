// apps/meteor/tests/end-to-end/api/chunkedUpload.ts
import { describe, it } from 'node:test';
import { expect } from 'chai';
import { getCredentials, api, request, credentials } from '../../data/api-data';
import { Random } from '@rocket.chat/random';

/**
 * Tests for the new chunked upload endpoint.
 * The test uploads a simple text file in two chunks, verifies the server assembles it,
 * and then retrieves the file to ensure the content matches the original.
 */

describe('[Chunked Upload]', () => {
  before((done) => getCredentials(done));

  it('should upload a file in two chunks and retrieve it', async () => {
    const uploadId = Random.id();
    const filename = 'test.txt';
    const content = 'HelloWorld'; // 10 bytes
    const chunkSize = 5;
    const firstChunk = content.slice(0, chunkSize);
    const secondChunk = content.slice(chunkSize);

    // Send first chunk
    const firstRes = await request
      .post(api('uploads/chunked'))
      .set(credentials)
      .set('x-upload-id', uploadId)
      .set('x-chunk-index', '0')
      .set('x-chunk-total', '2')
      .set('x-filename', filename)
      .set('Content-Type', 'application/octet-stream')
      .send(firstChunk)
      .expect('Content-Type', /json/)
      .expect(200);
    expect(firstRes.body).to.have.property('success', true);
    expect(firstRes.body).to.have.property('received', 1);
    expect(firstRes.body).to.have.property('total', 2);

    // Send second (final) chunk
    const secondRes = await request
      .post(api('uploads/chunked'))
      .set(credentials)
      .set('x-upload-id', uploadId)
      .set('x-chunk-index', '1')
      .set('x-chunk-total', '2')
      .set('x-filename', filename)
      .set('Content-Type', 'application/octet-stream')
      .send(secondChunk)
      .expect('Content-Type', /json/)
      .expect(200);
    expect(secondRes.body).to.have.property('success', true);
    expect(secondRes.body).to.have.property('fileId');
    const { fileId } = secondRes.body;

    // Retrieve the assembled file
    const getRes = await request
      .get(api(`uploads/chunked/${fileId}`))
      .set(credentials)
      .expect('Content-Type', /json/)
      .expect(200);
    expect(getRes.body).to.have.property('success', true);
    expect(getRes.body).to.have.property('data');
    const retrievedContent = Buffer.from(getRes.body.data, 'base64').toString('utf8');
    expect(retrievedContent).to.equal(content);
  });
});
