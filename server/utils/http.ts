import { IncomingHttpHeaders } from 'http';

import { request } from 'undici';

interface IPostParams {
	url: string;
	body: any;
	headers: IncomingHttpHeaders | string[] | null;
}

export function post(params: IPostParams): Promise<any> {
	const { url, body, headers } = params;

	return request(url, {
		method: 'POST',
		headers,
		body: JSON.stringify(body),
	});
}
