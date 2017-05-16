import crypto from 'crypto';
import urllib from 'url';
import querystring from 'querystring';

const Algorithm = 'AWS4-HMAC-SHA256';
const DefaultRegion = 'us-east-1';
const Service = 's3';
const KeyPartsRequest = 'aws4_request';

class Aws4 {
	constructor(req, credentials) {
		const { url, method = 'GET', body = '', date, region, headers = {}, expire = 86400 } = this.req = req;

		Object.assign(this, { url, body, method: method.toUpperCase() });

		const urlObj = urllib.parse(url);
		this.region = region || DefaultRegion;
		this.path = urlObj.pathname;
		this.host = urlObj.host;
		this.date = date || this.amzDate;
		this.credentials = credentials;
		this.headers = this.prepareHeaders(headers);
		this.expire = expire;
	}

	prepareHeaders() {
		const host = this.host;

		return {
			host
		};
	}

	hmac(key, string, encoding) {
		return crypto.createHmac('sha256', key).update(string, 'utf8').digest(encoding);
	}

	hash(string, encoding = 'hex') {
		return crypto.createHash('sha256').update(string, 'utf8').digest(encoding);
	}

	encodeRfc3986(urlEncodedString) {
		return urlEncodedString.replace(/[!'()*]/g, function(c) {
			return `%${ c.charCodeAt(0).toString(16).toUpperCase() }`;
		});
	}

	encodeQuery(query) {
		return this.encodeRfc3986(querystring.stringify(Object.keys(query).sort().reduce((obj, key) => {
			if (!key) { return obj; }
			obj[key] = !Array.isArray(query[key]) ? query[key] : query[key].slice().sort();
			return obj;
		}, {})));
	}

	get query() {
		const query = {};

		if (this.credentials.sessionToken) {
			query['X-Amz-Security-Token'] = this.credentials.sessionToken;
		}

		query['X-Amz-Expires'] = this.expire;
		query['X-Amz-Date'] = this.amzDate;
		query['X-Amz-Algorithm'] = Algorithm;
		query['X-Amz-Credential'] = `${ this.credentials.accessKeyId }/${ this.credentialScope }`;
		query['X-Amz-SignedHeaders'] = this.signedHeaders;

		return query;
	}

	get amzDate() {
		return (new Date()).toISOString().replace(/[:\-]|\.\d{3}/g, '');
	}

	get dateStamp() {
		return this.date.slice(0, 8);
	}

	get payloadHash() {
		return 'UNSIGNED-PAYLOAD';
	}

	get canonicalPath() {
		let pathStr = this.path;
		if (pathStr === '/') { return pathStr; }

		pathStr = pathStr.replace(/\/{2,}/g, '/');
		pathStr = pathStr.split('/').reduce((path, piece) => {
			if (piece === '..') {
				path.pop();
			} else {
				path.push(this.encodeRfc3986(querystring.escape(piece)));
			}
			return path;
		}, []).join('/');

		return pathStr;
	}

	get canonicalQuery() {
		return this.encodeQuery(this.query);
	}

	get canonicalHeaders() {
		const headers = Object.keys(this.headers)
			.sort((a, b) => a.toLowerCase() < b.toLowerCase() ? -1 : 1)
			.map(key => `${ key.toLowerCase() }:${ this.headers[key] }`);
		return `${ headers.join('\n') }\n`;
	}

	get signedHeaders() {
		return Object.keys(this.headers)
			.map(key => key.toLowerCase())
			.sort()
			.join(';');
	}

	get canonicalRequest() {
		return [
			this.method,
			this.canonicalPath,
			this.canonicalQuery,
			this.canonicalHeaders,
			this.signedHeaders,
			this.payloadHash
		].join('\n');
	}

	get credentialScope() {
		return [
			this.dateStamp,
			this.region,
			Service,
			KeyPartsRequest
		].join('/');
	}

	get stringToSign() {
		return [
			Algorithm,
			this.date,
			this.credentialScope,
			this.hash(this.canonicalRequest)
		].join('\n');
	}

	get signingKey() {
		const kDate = this.hmac(`AWS4${ this.credentials.secretKey }`, this.dateStamp);
		const kRegion = this.hmac(kDate, this.region);
		const kService = this.hmac(kRegion, Service);
		const kSigning = this.hmac(kService, KeyPartsRequest);

		return kSigning;
	}

	get signature() {
		return this.hmac(this.signingKey, this.stringToSign, 'hex');
	}

	// Export
	// Return signed query string
	sign() {
		const query = this.query;
		query['X-Amz-Signature'] = this.signature;

		return this.encodeQuery(query);
	}
}

export default {
	sign(request, credential) {
		return (new Aws4(request, credential)).sign();
	}
};
