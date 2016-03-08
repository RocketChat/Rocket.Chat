var crypto = Npm.require("crypto");

var S3bucket, S3accessKey, S3secretKey;

RocketChat.settings.get('FileUpload_S3_Bucket', function(key, value) {
	S3bucket = value;
});
RocketChat.settings.get('FileUpload_S3_AWSAccessKeyId', function(key, value) {
	S3accessKey = value;
});
RocketChat.settings.get('FileUpload_S3_AWSSecretAccessKey', function(key, value) {
	S3secretKey = value;
});

var generateURL = function(fullUrl) {
	var resourceURL = '/' + fullUrl.substr(fullUrl.indexOf(S3bucket));
	var expires = parseInt(new Date().getTime() / 1000) + 60;
	var StringToSign = 'GET\n\n\n' + expires +'\n'+resourceURL;

	var signature = crypto.createHmac('sha1', S3secretKey).update(new Buffer(StringToSign, "utf-8")).digest('base64');
	return fullUrl + '?AWSAccessKeyId='+encodeURIComponent(S3accessKey)+'&Expires='+expires+'&Signature='+encodeURIComponent(signature);
};

fileUploadResponse.register('s3', function(file, req, res, next) {
	res.setHeader('Location', generateURL(file.url));
	res.writeHead(302);
	res.end();
});
