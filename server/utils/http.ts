import { request } from 'undici';

// undici typings from the official package
// are kinda awkward but things seem to have
// been figured out in 4.0 release candidates
// TODO: remove ts-ignore flags once 4.0 rolls out as stable
export default class HTTP {
	static post(url: string, data: any): PromiseLike<any> {
		// @ts-ignore
		return request(url, {
			method: 'POST',
			headers: data.headers,
			body: JSON.stringify(data.body),
		});
	}
}
