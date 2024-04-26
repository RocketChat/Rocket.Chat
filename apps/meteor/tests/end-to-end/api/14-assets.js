import { expect } from 'chai';
import { before, describe, it, after } from 'mocha';

import { getCredentials, api, request, credentials } from '../../data/api-data.js';
import { imgURL } from '../../data/interactions';
import { updatePermission } from '../../data/permissions.helper';

describe('[Assets]', function () {
	this.retries(0);

	before((done) => getCredentials(done));

	before(() => updatePermission('manage-assets', ['admin']));

	after(() => updatePermission('manage-assets', ['admin']));

	describe('[/assets.setAsset]', () => {
		it('should set the "logo" asset', (done) => {
			request
				.post(api('assets.setAsset'))
				.set(credentials)
				.attach('asset', imgURL)
				.field({
					assetName: 'logo',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});
		it('should throw an error when we try set an invalid asset', (done) => {
			request
				.post(api('assets.setAsset'))
				.set(credentials)
				.attach('invalidAsset', imgURL)
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
				})
				.end(done);
		});
	});

	describe('[/assets.unsetAsset]', () => {
		it('should unset the "logo" asset', (done) => {
			request
				.post(api('assets.unsetAsset'))
				.set(credentials)
				.send({
					assetName: 'logo',
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.expect((res) => {
					expect(res.body).to.have.property('success', true);
				})
				.end(done);
		});
		it('should throw an error when we try set an invalid asset', (done) => {
			request
				.post(api('assets.unsetAsset'))
				.set(credentials)
				.send({
					assetName: 'invalidAsset',
				})
				.expect('Content-Type', 'application/json')
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property('success', false);
				})
				.end(done);
		});
	});
});
