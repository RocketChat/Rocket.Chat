import { getCredentials, request, credentials } from '../../data/api-data.js';
import { apps } from '../../data/apps/apps-data.js';
import { cleanupApps, installTestApp } from '../../data/apps/helper.js';

describe('Apps - Send Messages', function() {
	this.retries(0);
	let app;

	before((done) => getCredentials(done));
	before(async () => {
		await cleanupApps();
		app = await installTestApp();
	});

	describe('[Send Message as app user]', () => {
		it('should send a message as app user', (done) => {
			request.post(apps(`/public/${ app.id }/send-message-as-app-user`))
				.set(credentials)
				.expect(200)
				.end(done);
		});
	});
});
