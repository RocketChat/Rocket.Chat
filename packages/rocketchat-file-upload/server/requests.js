var crypto = Npm.require("crypto");
var stream = Npm.require('stream');
var zlib = Npm.require('zlib');

var S3bucket, S3accessKey, S3secretKey, protectedFiles;

RocketChat.settings.get('FileUpload_S3_Bucket', function(key, value) {
	S3bucket = value;
});
RocketChat.settings.get('FileUpload_S3_AWSAccessKeyId', function(key, value) {
	S3accessKey = value;
});
RocketChat.settings.get('FileUpload_S3_AWSSecretAccessKey', function(key, value) {
	S3secretKey = value;
});

RocketChat.settings.get('FileUpload_ProtectFiles', function(key, value) {
	protectedFiles = value;
});

var generateURL = function(fullUrl) {
	var resourceURL = '/' + fullUrl.substr(fullUrl.indexOf(S3bucket));
	var expires = parseInt(new Date().getTime() / 1000) + 60;
	var StringToSign = 'GET\n\n\n' + expires +'\n'+resourceURL;

	var signature = crypto.createHmac('sha1', S3secretKey).update(new Buffer(StringToSign, "utf-8")).digest('base64');
	return fullUrl + '?AWSAccessKeyId='+encodeURIComponent(S3accessKey)+'&Expires='+expires+'&Signature='+encodeURIComponent(signature);
};

// code from: https://github.com/jalik/jalik-ufs/blob/master/ufs-server.js#L91
var readFromGridFS = function(storeName, fileId, file, req, res) {
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
	var headers = {
		'Content-Type': file.type,
		'Content-Length': file.size
	};

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

WebApp.connectHandlers.use('/file-upload/', function(req, res, next) {
	var file;

	var match = /^\/([^\/]+)\/(.*)/.exec(req.url);

	if (match[1]) {
		file = RocketChat.models.Uploads.findOneById(match[1]);

		if (file) {
			if (protectedFiles) {
				var cookie, rawCookies, ref, token, uid;
				cookie = new Cookies();

				if ((typeof req !== "undefined" && req !== null ? (ref = req.headers) != null ? ref.cookie : void 0 : void 0) != null) {
					rawCookies = req.headers.cookie;
				}

				if (rawCookies != null) {
					uid = cookie.get('rc_uid', rawCookies);
				}

				if (rawCookies != null) {
					token = cookie.get('rc_token', rawCookies);
				}

				if (uid == null) {
					uid = req.query.rc_uid;
					token = req.query.rc_token;
				}

				if (!(uid && token && RocketChat.models.Users.findOneByIdAndLoginToken(uid, token))) {
					res.writeHead(403);
					res.end();
					return false;
				}
			}
			res.setHeader('Content-Disposition', "attachment; filename=\"" + encodeURIComponent(file.name) + "\"");
			res.setHeader('Last-Modified', file.uploadedAt.toUTCString());
			res.setHeader('Content-Type', file.type);
			res.setHeader('Content-Length', file.size);

			if (file.store === 's3') {
				var newUrl = generateURL(file.url);
				res.setHeader('Location', newUrl);
				res.writeHead(302);
				res.end();
				return;
			} else {
				return readFromGridFS(file.store, file._id, file, req, res);
			}
		}
	}

	res.writeHead(404);
	res.end();
	return;
});
