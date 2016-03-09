/* globals fileUploadResponse*/

var crypto = Npm.require('crypto');

var S3accessKey, S3secretKey;

RocketChat.settings.get('FileUpload_S3_AWSAccessKeyId', function(key, value) {
	S3accessKey = value;
});
RocketChat.settings.get('FileUpload_S3_AWSSecretAccessKey', function(key, value) {
	S3secretKey = value;
});

var generateURL = function(file) {
	if (!file || !file.s3) {
		return;
	}
	let resourceURL = '/' + file.s3.bucket + '/' + file.s3.path + file._id;
	let expires = parseInt(new Date().getTime() / 1000) + 60;
	let StringToSign = 'GET\n\n\n' + expires +'\n'+resourceURL;
	let signature = crypto.createHmac('sha1', S3secretKey).update(new Buffer(StringToSign, 'utf-8')).digest('base64');
	return file.url + '?AWSAccessKeyId='+encodeURIComponent(S3accessKey)+'&Expires='+expires+'&Signature='+encodeURIComponent(signature);
};

fileUploadResponse.register('s3', function(file, req, res) {
	let fileUrl = generateURL(file);

	if (fileUrl) {
		res.setHeader('Location', fileUrl);
		res.writeHead(302);
	}
	res.end();
});
