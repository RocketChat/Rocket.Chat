import { randomUUID } from 'crypto';
import { readFileSync } from 'fs';
import path from 'path';

import { expect } from 'chai';
import { before, describe, it } from 'mocha';

import { getCredentials, api, request, credentials } from '../../data/api-data.js';

describe('[CustomSounds]', function () {
	this.retries(0);

	before((done) => getCredentials(done));

	describe('[/custom-sounds.list]', () => {
		it('should return custom sounds', (done) => {
			request
				.get(api('custom-sounds.list'))
				.set(credentials)
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('sounds').and.to.be.an('array');
					expect(res.body).to.have.property('total');
					expect(res.body).to.have.property('offset');
					expect(res.body).to.have.property('count');
				})
				.end(done);
		});
		it('should return custom sounds even requested with count and offset params', (done) => {
			request
				.get(api('custom-sounds.list'))
				.set(credentials)
				.expect(200)
				.query({
					count: 5,
					offset: 0,
				})
				.expect((res) => {
					expect(res.body).to.have.property('sounds').and.to.be.an('array');
					expect(res.body).to.have.property('total');
					expect(res.body).to.have.property('offset');
					expect(res.body).to.have.property('count');
				})
				.end(done);
		});
	});

	describe('Accessing custom sounds', () => {
		let fileId;
		const fileName = `test-file-${randomUUID()}`;
		let uploadDate;

		before(async () => {
			const data = readFileSync(path.resolve(__dirname, '../../mocks/files/audio_mock.wav'));
			const binary = Buffer.from(data, 'base64').toString('binary');
			await request
				.post(api('method.call/insertOrUpdateSound'))
				.set(credentials)
				.send({
					message: JSON.stringify({
						msg: 'method',
						id: '1',
						method: 'insertOrUpdateSound',
						params: [{ name: fileName, extension: 'mp3', newFile: true }],
					}),
				})
				.expect(200)
				.expect((res) => {
					fileId = JSON.parse(res.body.message).result;
				});
			await request
				.post(api('method.call/uploadCustomSound'))
				.set(credentials)
				.send({
					message: JSON.stringify({
						msg: 'method',
						id: '2',
						method: 'uploadCustomSound',
						params: [binary, 'audio/wav', { name: fileName, extension: 'wav', newFile: true, _id: fileId }],
					}),
				})
				.expect(200);
		});

		it('should return forbidden if the there is no fileId on the url', (done) => {
			request
				.get('/custom-sounds/')
				.set(credentials)
				.expect(403)
				.expect((res) => {
					expect(res.text).to.be.equal('Forbidden');
				})
				.end(done);
		});

		it('should return not found if the the requested file does not exists', (done) => {
			request
				.get('/custom-sounds/invalid.mp3')
				.set(credentials)
				.expect(404)
				.expect((res) => {
					expect(res.text).to.be.equal('Not found');
				})
				.end(done);
		});

		it('should return success if the the requested exists', (done) => {
			request
				.get(`/custom-sounds/${fileId}.wav`)
				.set(credentials)
				.expect(200)
				.expect((res) => {
					expect(res.headers).to.have.property('last-modified');
					expect(res.headers).to.have.property('content-type', 'audio/wav');
					expect(res.headers).to.have.property('cache-control', 'public, max-age=0');
					expect(res.headers).to.have.property('expires', '-1');
					uploadDate = res.headers['last-modified'];
				})
				.end(done);
		});

		it('should return not modified if the the requested file contains a valid-since equal to the upload date', (done) => {
			request
				.get(`/custom-sounds/${fileId}.wav`)
				.set(credentials)
				.set({
					'if-modified-since': uploadDate,
				})
				.expect(304)
				.expect((res) => {
					expect(res.headers).to.have.property('last-modified', uploadDate);
					expect(res.headers).not.to.have.property('content-type');
					expect(res.headers).not.to.have.property('cache-control');
					expect(res.headers).not.to.have.property('expires');
				})
				.end(done);
		});
	});
});
