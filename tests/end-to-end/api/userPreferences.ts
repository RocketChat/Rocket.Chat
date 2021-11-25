import { getCredentials, request, credentials, methodCall } from '../../data/api-data.js';

describe('User Preferences', function() {
	this.retries(0);

	before((done) => getCredentials(done));

	describe('[/saveUserPreferences]', () => {
		it('should save correctly user preferences', (done) => {
			request.post(methodCall('saveUserPreferences'))
				.set(credentials)
				.send({
					message: JSON.stringify({
						method: 'saveUserPreferences',
						params: [{ emailNotificationMode: 'nothing' }],
					}),
				})
				.expect('Content-Type', 'application/json')
				.expect(200)
				.end(done);
		});
	});
});
