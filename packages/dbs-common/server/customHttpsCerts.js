/**
 * Hack to apply own certs
 */
(function () {
	var https = Npm.require('https');
	var certDir = process.env.CA_CERT_PATH;

	if (!certDir) { //backwards compatible
		certDir = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'] + '/.nodeCaCerts/';
	}

	var caMap = (function () {
		try {
			var fs = Npm.require('fs');
			var result = {};
			if (fs.statSync(certDir).isDirectory()) {
				var certList = fs.readdirSync(certDir);
				for (var i = 0; i < certList.length; i++) {
					result[certList[i]] = fs.readFileSync(certDir +  certList[i]);
					console.info('Loaded certificate ' + certList[i]);
				}
			}

			console.info("HTTP-Proxy", process.env.HTTP_PROXY);
			console.info("HTTPS-Proxy", process.env.HTTPS_PROXY);
			console.info("No Proxy", process.env.NO_PROXY);
		} catch (e) {
			console.warn("unable to load private root certs from path: " + certDir, e);
		}
		return result;
	})();
	https.request = (function (request) {
		return function (options, cb) {
			if (options && !options.ca) {
				var crt = caMap[options.hostname || options.host];
				if(crt) {
					options.ca = caMap[options.hostname || options.host];
					console.info("Issuing secured request to ", (options.hostname || options.host));
				}
			}
			return request.call(https, options, cb);
		};
	})(https.request);
})();
