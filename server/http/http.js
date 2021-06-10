import { request } from 'undici';


export default class HTTP {
	static post(url, data) {
		return request(url, {
			method: 'POST',
			headers: data.headers,
			body: JSON.stringify(data.body),
		});
	}
}
