import type http from 'http';
import URL from 'url';

export const forceDownload = (req: http.IncomingMessage): boolean => {
	const { query } = URL.parse(req.url || '', true);

	const forceDownload = typeof query.download !== 'undefined';
	if (forceDownload) {
		return true;
	}

	return query.contentDisposition === 'attachment';
};

export const getContentDisposition = (req: http.IncomingMessage): string => {
	const { query } = URL.parse(req.url || '', true);
	if (query.contentDisposition === 'inline') {
		return 'inline';
	}
	return 'attachment';
};
