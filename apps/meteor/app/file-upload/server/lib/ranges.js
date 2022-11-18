export function getByteRange(header) {
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

export function getFileRange(file, req) {
	const range = getByteRange(req.headers.range);
	if (!range) {
		return;
	}
	if (range.start > file.size || range.stop <= range.start || range.stop > file.size) {
		return { outOfRange: true };
	}

	return { start: range.start, stop: range.stop };
}

// code from: https://github.com/jalik/jalik-ufs/blob/master/ufs-server.js#L310
export const setRangeHeaders = function (range, file, res) {
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
