import type http from 'http';

import type { IUpload } from '@rocket.chat/core-typings';

function getByteRange(header?: string) {
	if (!header) {
		return;
	}
	const matches = header.match(/(\d+)-(\d+)/);
	if (!matches) {
		return;
	}
	return {
		start: parseInt(matches[1], 10),
		stop: parseInt(matches[2], 10),
	};
}

export function getFileRange(file: IUpload, req: http.IncomingMessage) {
	const range = getByteRange(req.headers.range);
	if (!range) {
		return;
	}
	const size = file.size || 0;
	if (range.start > size || range.stop <= range.start || range.stop > size) {
		return { outOfRange: true, start: range.start, stop: range.stop };
	}

	return { outOfRange: false, start: range.start, stop: range.stop };
}

// code from: https://github.com/jalik/jalik-ufs/blob/master/ufs-server.js#L310
export const setRangeHeaders = function (
	range: { start: number; stop: number; outOfRange?: boolean } | undefined,
	file: IUpload,
	res: http.ServerResponse,
) {
	if (!range) {
		return;
	}

	if (range.outOfRange) {
		// out of range request, return 416
		res.removeHeader('Content-Length');
		res.removeHeader('Content-Type');
		res.removeHeader('Content-Disposition');
		res.removeHeader('Last-Modified');
		res.setHeader('Content-Range', `bytes */${file.size}`);
		res.writeHead(416);
		res.end();
		return;
	}

	res.setHeader('Content-Range', `bytes ${range.start}-${range.stop}/${file.size}`);
	res.removeHeader('Content-Length');
	res.setHeader('Content-Length', range.stop - range.start + 1);
	res.statusCode = 206;
};
