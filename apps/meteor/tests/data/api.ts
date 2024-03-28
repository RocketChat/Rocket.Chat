import { request } from './api-data';

const prefix = '/api/v1/';

export function apix(path: string) {
	return {
		get: () => request.get(prefix + path),
		post: (data: any) => request.post(prefix + path, data),
		put: (data: any) => request.put(prefix + path, data),
		delete: () => request.delete(prefix + path),
	};
}
