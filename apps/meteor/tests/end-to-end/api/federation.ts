import { expect } from 'chai';
import { after, before, describe, it } from 'mocha';

import { getCredentials, request } from '../../data/api-data';
import { updateSetting } from '../../data/permissions.helper';

describe('federation', () => {
	before((done) => getCredentials(done));

	// FIXME: why debouncing is causing timeouts here on the hooks?
	// Since we don't care about the watchers on this setting, not debouncing is fine.
	describe('well-known', () => {
		describe('when matrix disabled', () => {
			before(async () => {
				await updateSetting('Federation_Matrix_enabled', false, false);
				await updateSetting('Federation_Matrix_serve_well_known', true, false);
			});

			after(async () => {
				await updateSetting('Federation_Matrix_serve_well_known', false, false);
			});

			it('should return 404 not found', async () => {
				await request.get('/.well-known/matrix/server').expect(404);

				await request.get('/.well-known/matrix/client').expect(404);
			});
		});

		describe('when matrix enabled but well-known disabled', () => {
			before(async () => {
				await updateSetting('Federation_Matrix_enabled', true, false);
				await updateSetting('Federation_Matrix_serve_well_known', false, false);
			});

			after(async () => {
				await updateSetting('Federation_Matrix_enabled', false, false);
			});

			it('should return 404 not found', async () => {
				await request.get('/.well-known/matrix/server').expect(404);

				await request.get('/.well-known/matrix/client').expect(404);
			});
		});

		describe('when enabled', () => {
			before(async () => {
				await updateSetting('Federation_Matrix_enabled', true, false);
				await updateSetting('Federation_Matrix_serve_well_known', true, false);
			});

			after(async () => {
				await updateSetting('Federation_Matrix_enabled', false, false);
				await updateSetting('Federation_Matrix_serve_well_known', false, false);
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
