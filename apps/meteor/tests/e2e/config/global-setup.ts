import addCustomOAuth from '../fixtures/addCustomOAuth';
import injectInitialData from '../fixtures/inject-initial-data';
import insertApp from '../fixtures/insert-apps';

export default async function (): Promise<void> {
	await injectInitialData();

	await insertApp();

	await addCustomOAuth();
}
