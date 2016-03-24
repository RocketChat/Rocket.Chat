/* globals FileUpload, UploadFS */
var stream = Npm.require('stream');
var zlib = Npm.require('zlib');

// code from: https://github.com/jalik/jalik-ufs/blob/master/ufs-server.js#L91
var readFromGridFS = function(storeName, fileId, file, headers, req, res) {
	var store = UploadFS.getStore(storeName);
	var rs = store.getReadStream(fileId, file);
	var ws = new stream.PassThrough();

	rs.on('error', function (err) {
		store.onReadError.call(store, err, fileId, file);
		res.end();
	});
	ws.on('error', function (err) {
		store.onReadError.call(store, err, fileId, file);
		res.end();
	});
	ws.on('close', function () {
		// Close output stream at the end
		ws.emit('end');
	});

	var accept = req.headers['accept-encoding'] || '';

	// Transform stream
	store.transformRead(rs, ws, fileId, file, req, headers);

	// Compress data using gzip
	if (accept.match(/\bgzip\b/)) {
		headers['Content-Encoding'] = 'gzip';
		delete headers['Content-Length'];
		res.writeHead(200, headers);
		ws.pipe(zlib.createGzip()).pipe(res);
	}
	// Compress data using deflate
	else if (accept.match(/\bdeflate\b/)) {
		headers['Content-Encoding'] = 'deflate';
		delete headers['Content-Length'];
		res.writeHead(200, headers);
		ws.pipe(zlib.createDeflate()).pipe(res);
	}
	// Send raw data
	else {
		res.writeHead(200, headers);
		ws.pipe(res);
	}
};

FileUpload.addHandler('rocketchat_uploads', {
	get(file, req, res) {
		let headers = {
			'Content-Disposition': 'attachment; filename="' + encodeURIComponent(file.name) + '"',
			'Last-Modified': file.uploadedAt.toUTCString(),
			'Content-Type': file.type,
			'Content-Length': file.size
		};
		return readFromGridFS(file.store, file._id, file, headers, req, res);
	},
	delete(file) {
		return Meteor.fileStore.delete(file._id);
	}
});
