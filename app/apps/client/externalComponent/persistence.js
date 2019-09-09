import { APIClient } from '../../../utils';

export function setItem(appId, key, value) {
	APIClient.post(`apps/${ appId }/persistence/setItem`, { key, value });
}

export async function getItem(appId, key) {
	const result = await APIClient.post(`apps/${ appId }/persistence/getItem`, { key });

	return result;
}

export async function getAll(appId) {
	const result = await APIClient.get(`apps/${ appId }/persistence/getAll`);

	return result;
}

export function removeItem(appId, key) {
	APIClient.post(`apps/${ appId }/persistence/removeItem`, { key });
}

export function clear(appId) {
	APIClient.get(`apps/${ appId }/persistence/clear`);
}
