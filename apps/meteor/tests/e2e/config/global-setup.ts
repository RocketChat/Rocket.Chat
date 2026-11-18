import addCustomOAuth from '../fixtures/addCustomOAuth';
import enableOmnichannel from '../fixtures/enableOmnichannel';
import injectInitialData from '../fixtures/inject-initial-data';
import { insertDefaultTestApp } from '../utils/apps';

export default async function (): Promise<void> {
	await injectInitialData();

	await insertDefaultTestApp();

	await addCustomOAuth();

	await enableOmnichannel();
}
