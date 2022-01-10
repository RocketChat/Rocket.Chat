import http from 'http';
import https from 'https';

export function getUnsafeAgent(protocol: 'http:' | 'https:'): http.Agent | https.Agent | null {
	if (protocol === 'http:') {
		return new http.Agent();
	}
	if (protocol === 'https:') {
		return new https.Agent({
			rejectUnauthorized: false,
		});
	}
	return null;
}
