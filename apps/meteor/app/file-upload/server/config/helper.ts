import http from 'http';
import URL from 'url';

export const forceDownload = (req: http.IncomingMessage): boolean => {
	const { query } = URL.parse(req.url || '', true);
	let forceDownload = typeof query.download !== 'undefined';
	if (!forceDownload) {
		switch (query.contentDisposition) {
			case 'inline':
				forceDownload = false;
				break;
			case 'attachment':
				forceDownload = true;
				break;
		}
	}
	return forceDownload;
};

export const getContentDisposition = (req: http.IncomingMessage): string => {
	const { query } = URL.parse(req.url || '', true) as any;
	if (query.contentDisposition === 'inline') {
		return 'inline';
	}
	return 'attachment';
};
