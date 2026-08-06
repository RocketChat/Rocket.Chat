import type http from 'node:http';

import type { IUpload } from '@rocket.chat/core-typings';

type ByteRange = { start?: number; stop?: number };

function parseByteRange(header?: string): ByteRange | undefined {
	if (!header) {
		return;
	}
	const matches = header.match(/^bytes=(\d*)-(\d*)$/);
	if (!matches) {
		return;
	}
	const [, startStr, stopStr] = matches;
	if (startStr === '' && stopStr === '') {
		return;
	}
	return {
		start: startStr === '' ? undefined : parseInt(startStr, 10),
		stop: stopStr === '' ? undefined : parseInt(stopStr, 10),
	};
}

export function getFileRange(file: IUpload, req: http.IncomingMessage) {
	const parsed = parseByteRange(req.headers.range);
	if (!parsed) {
		return;
	}

	const size = file.size || 0;
	if (size <= 0) {
		return;
	}

	let { start, stop } = parsed;

	if (start === undefined) {
		if (!stop) {
			return { outOfRange: true, start: 0, stop: size - 1 };
		}
		start = Math.max(0, size - stop);
		stop = size - 1;
	} else if (stop === undefined || stop > size - 1) {
		stop = size - 1;
	}

	if (start > stop || start >= size) {
		return { outOfRange: true, start, stop };
	}

	return { outOfRange: false, start, stop };
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
