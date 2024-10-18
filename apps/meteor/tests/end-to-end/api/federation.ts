import { expect } from 'chai';
import { after, before, describe, it } from 'mocha';

import { getCredentials, request } from '../../data/api-data';
import { updateSetting } from '../../data/permissions.helper';

describe('federation', () => {
	before((done) => getCredentials(done));

	describe('well-known', () => {
		describe('when matrix disabled', () => {
			before(async () => {
				await updateSetting('Federation_Matrix_enabled', false);
				console.log('done');
				await updateSetting('Federation_Matrix_serve_well_known', true);
				console.log('done');
			});

			after(async () => {
				await updateSetting('Federation_Matrix_serve_well_known', false);
				console.log('done after');
			});

			it('should return 404 not found', async () => {
				await request.get('/.well-known/matrix/server').expect(404);

				await request.get('/.well-known/matrix/client').expect(404);
			});
		});

		describe('when matrix enabled but well-known disabled', () => {
			before(async () => {
				await updateSetting('Federation_Matrix_enabled', true);
				console.log('done');
				await updateSetting('Federation_Matrix_serve_well_known', false);
				console.log('done');
			});

			after(async () => {
				await updateSetting('Federation_Matrix_enabled', false);
				console.log('done after');
			});

			it('should return 404 not found', async () => {
				console.log('should start the actual test now');
				await request.get('/.well-known/matrix/server').expect(404);

				await request.get('/.well-known/matrix/client').expect(404);
			});
		});

		describe('when enabled', () => {
			before(async () => {
				await updateSetting('Federation_Matrix_enabled', true);
				await updateSetting('Federation_Matrix_serve_well_known', true);
			});

			after(async () => {
				await updateSetting('Federation_Matrix_enabled', false);
				await updateSetting('Federation_Matrix_serve_well_known', false);
			});

			it('should return matrix information', async () => {
				await request
					.get('/.well-known/matrix/server')
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body).to.have.property('m.server', 'localhost:8008');
					});

				await request
					.get('/.well-known/matrix/client')
					.expect('Content-Type', 'application/json')
					.expect(200)
					.expect((res) => {
						expect(res.body['m.homeserver']).to.have.property('base_url', 'http://localhost');
					});
			});
		});
	});
});
