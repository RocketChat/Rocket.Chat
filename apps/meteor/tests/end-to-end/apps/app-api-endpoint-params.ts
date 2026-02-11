import type { App } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { after, before, describe, it } from 'mocha';

import { getCredentials, request, credentials } from '../../data/api-data';
import { appAPIParameterTest } from '../../data/apps/app-packages';
import { apps } from '../../data/apps/apps-data';
import { cleanupApps, installLocalTestPackage } from '../../data/apps/helper';

describe('Apps - API Endpoint Parameter Parsing', () => {
	let app: App;

	before((done) => getCredentials(done));

	before(async () => {
		await cleanupApps();
		app = await installLocalTestPackage(appAPIParameterTest);
	});

	after(() => cleanupApps());

	it('should correctly parse URL parameters in API endpoint', async () => {
		const param1Value = 'test-value-1';
		const param2Value = 'test-value-2';

		const response = await request.get(apps(`/public/${app.id}/api/${param1Value}/${param2Value}/test`)).set(credentials);

		expect(response.status, 'API endpoint request failed').to.equal(200);
		expect(response.header['content-type'], 'Content-Type header is incorrect').to.include('text/plain');
		expect(response.text, 'Response body does not contain correct parameters').to.equal(`Param1: ${param1Value}, Param2: ${param2Value}`);
	});

	it('should handle special characters in URL parameters', async () => {
		const param1Value = 'hello-world';
		const param2Value = '123-456';

		const response = await request.get(apps(`/public/${app.id}/api/${param1Value}/${param2Value}/test`)).set(credentials);

		expect(response.status, 'API endpoint request failed').to.equal(200);
		expect(response.text, 'Response body does not contain correct parameters').to.equal(`Param1: ${param1Value}, Param2: ${param2Value}`);
	});
});
