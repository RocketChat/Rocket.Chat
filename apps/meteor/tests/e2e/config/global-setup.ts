import injectInitialData from '../fixtures/inject-initial-data';
import insertApp from '../fixtures/insert-apps';

export default async function (): Promise<void> {
	await injectInitialData();

	await insertApp();
}
