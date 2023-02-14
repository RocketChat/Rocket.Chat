import { expect } from 'chai';
import proxyquire from 'proxyquire';
import s from 'underscore.string';

const { _getURL } = proxyquire.noCallThru().load('../../../../../app/utils/lib/getURL', {
	'meteor/meteor': {
		'Meteor': {
			absoluteUrl() {
				return 'http://localhost:3000/';
			},
		},
		'@global': true,
	},
	'../../settings': {
		settings: {
			get: () => 'https://go.rocket.chat',
		},
	},
});

const testPaths = (o, _processPath) => {
	let processPath = _processPath;
	if (o._root_url_path_prefix !== '') {
		processPath = (path) => _processPath(o._root_url_path_prefix + path);
	}

	expect(_getURL('', o)).to.be.equal(processPath(''));
	expect(_getURL('/', o)).to.be.equal(processPath(''));
	expect(_getURL('//', o)).to.be.equal(processPath(''));
	expect(_getURL('///', o)).to.be.equal(processPath(''));
	expect(_getURL('/channel', o)).to.be.equal(processPath('/channel'));
	expect(_getURL('/channel/', o)).to.be.equal(processPath('/channel'));
	expect(_getURL('/channel//', o)).to.be.equal(processPath('/channel'));
	expect(_getURL('/channel/123', o)).to.be.equal(processPath('/channel/123'));
	expect(_getURL('/channel/123/', o)).to.be.equal(processPath('/channel/123'));
	expect(_getURL('/channel/123?id=456&name=test', o)).to.be.equal(processPath('/channel/123?id=456&name=test'));
	expect(_getURL('/channel/123/?id=456&name=test', o)).to.be.equal(processPath('/channel/123?id=456&name=test'));
};

const getCloudUrl = (_site_url, path) => {
	path = s.ltrim(path, '/');
	const url = `https://go.rocket.chat/?host=${encodeURIComponent(_site_url.replace(/https?:\/\//, ''))}&path=${encodeURIComponent(path)}`;
	if (_site_url.includes('http://')) {
		return `${url}&secure=no`;
	}
	return url;
};

const testCases = (options) => {
	const _site_url = s.rtrim(options._site_url, '/');

	if (!options.cloud) {
		if (options._cdn_prefix === '') {
			if (options.full && !options.cdn) {
				it('should return with host if full: true', () => {
					testPaths(options, (path) => _site_url + path);
				});
			}

			if (!options.full && options.cdn) {
				it('should return without cdn prefix if cdn: true', () => {
					testPaths(options, (path) => path);
				});
			}

			if (!options.full && !options.cdn) {
				it('should return without host by default', () => {
					testPaths(options, (path) => path);
				});
			}

			if (options.full && options.cdn) {
				it('should return with host if full: true and cdn: true', () => {
					testPaths(options, (path) => _site_url + path);
				});
			}
		} else {
			if (options.full && !options.cdn) {
				it('should return with host if full: true', () => {
					testPaths(options, (path) => _site_url + path);
				});
			}

			if (!options.full && options.cdn) {
				it('should return with cdn prefix if cdn: true', () => {
					testPaths(options, (path) => options._cdn_prefix + path);
				});
			}

			if (!options.full && !options.cdn) {
				it('should return without host by default', () => {
					testPaths(options, (path) => path);
				});
			}

			if (options.full && options.cdn) {
				it('should return with cdn prefix if full: true and cdn: true', () => {
					testPaths(options, (path) => options._cdn_prefix + path);
				});
			}
		}
	} else if (options._cdn_prefix === '') {
		if (!options.full && options.cdn) {
			it('should return with cloud host if cdn: true', () => {
				testPaths(options, (path) => getCloudUrl(_site_url, path));
			});
		}

		if (!options.full && !options.cdn) {
			it('should return with cloud host if full: fase and cdn: false', () => {
				testPaths(options, (path) => getCloudUrl(_site_url, path));
			});
		}
	} else if (!options.full && !options.cdn) {
		it('should return with cloud host if full: fase and cdn: false', () => {
			testPaths(options, (path) => getCloudUrl(_site_url, path));
		});
	}
};

const testCasesForOptions = (description, options) => {
	describe(description, () => {
		testCases({ ...options, cdn: false, full: false, cloud: false });
		testCases({ ...options, cdn: true, full: false, cloud: false });
		testCases({ ...options, cdn: false, full: true, cloud: false });
		testCases({ ...options, cdn: false, full: false, cloud: true });
		testCases({ ...options, cdn: true, full: true, cloud: false });
		testCases({ ...options, cdn: false, full: true, cloud: true });
		testCases({ ...options, cdn: true, full: false, cloud: true });
		testCases({ ...options, cdn: true, full: true, cloud: true });
	});
};

describe('getURL', () => {
	testCasesForOptions('getURL with no CDN, no PREFIX for http://localhost:3000/', {
		_cdn_prefix: '',
		_root_url_path_prefix: '',
		_site_url: 'http://localhost:3000/',
	});

	testCasesForOptions('getURL with no CDN, no PREFIX for http://localhost:3000', {
		_cdn_prefix: '',
		_root_url_path_prefix: '',
		_site_url: 'http://localhost:3000',
	});

	testCasesForOptions('getURL with CDN, no PREFIX for http://localhost:3000/', {
		_cdn_prefix: 'https://cdn.com',
		_root_url_path_prefix: '',
		_site_url: 'http://localhost:3000/',
	});

	testCasesForOptions('getURL with CDN, PREFIX for http://localhost:3000/', {
		_cdn_prefix: 'https://cdn.com',
		_root_url_path_prefix: 'sub',
		_site_url: 'http://localhost:3000/',
	});

	testCasesForOptions('getURL with CDN, PREFIX for https://localhost:3000/', {
		_cdn_prefix: 'https://cdn.com',
		_root_url_path_prefix: 'sub',
		_site_url: 'https://localhost:3000/',
	});
});
