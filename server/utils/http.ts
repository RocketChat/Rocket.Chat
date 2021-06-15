import { request } from 'undici';

export default class HTTP {
	static post(url: string, data: any): Promise<any> {
		return request(url, {
			method: 'POST',
			headers: data.headers,
			body: JSON.stringify(data.body),
		});
	}
}
