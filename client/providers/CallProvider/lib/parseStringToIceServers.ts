import { IceServer } from '../definitions/IceServer';

export const parseStringToIceServer = (server: string): IceServer => {
	const [urls, ...credentials] = server.trim().split('@');
	const [username, credential] = credentials.length === 1 ? credentials[0].split(':') : [];

	return {
		urls,
		...(username &&
			credential && {
				username: decodeURIComponent(username),
				credential: decodeURIComponent(credential),
			}),
	};
};

export const parseStringToIceServers = (string: string): IceServer[] => {
	const lines = string.trim() ? string.split(',') : [];
	return lines.map((line) => parseStringToIceServer(line));
};
