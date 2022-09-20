import { expect } from 'chai';

import { getCredentials, api, request, credentials } from '../../data/api-data.js';
import { getURL } from '../../../app/utils/lib/getURL';
import { createSoundData } from '../../../client/views/admin/customSounds/lib';

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

	describe('[/custom-sounds.uploadCustomSound]', () => {
		const soundData = createSoundData(getURL('sounds/door.mp3'), 'Door');

		it('should upload custom sounds', (done) => {
			request
				.post(api('custom-sounds.uploadCustomSound'))
				.set(credentials)
				.send({
					sound: getURL('sounds/door.mp3'),
					contentType: 'audio/mp3',
					soundData,
				})
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});
		it('should not upload custom sounds when the sound param is missing', (done) => {
			request
				.get(api('custom-sounds.uploadCustomSound'))
				.set(credentials)
				.expect(400)
				.send({
					contentType: 'audio/mp3',
					soundData,
				})
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
				})
				.end(done);
		});
		it('should not upload custom sounds when the soundData param is missing', (done) => {
			request
				.get(api('custom-sounds.uploadCustomSound'))
				.set(credentials)
				.expect(400)
				.send({
					sound: getURL('sounds/door.mp3'),
					contentType: 'audio/mp3',
				})
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
				})
				.end(done);
		});
	});
});
