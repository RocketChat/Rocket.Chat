import { describe, it } from 'node:test';

import { expect } from 'chai';

import { _getURL } from './getURL';
import { ltrim, rtrim } from './utils/stringUtils';

const testPaths = (o, _processPath) => {
	let processPath = _processPath;
	if (o._root_url_path_prefix !== '') {
		processPath = (path) => _processPath(o._root_url_path_prefix + path);
	}

	const cloudDeepLinkUrl = 'https://go.rocket.chat';

	expect(_getURL('', o, cloudDeepLinkUrl)).to.be.equal(processPath(''));
	expect(_getURL('/', o, cloudDeepLinkUrl)).to.be.equal(processPath(''));
	expect(_getURL('//', o, cloudDeepLinkUrl)).to.be.equal(processPath(''));
	expect(_getURL('///', o, cloudDeepLinkUrl)).to.be.equal(processPath(''));
	expect(_getURL('/channel', o, cloudDeepLinkUrl)).to.be.equal(processPath('/channel'));
	expect(_getURL('/channel/', o, cloudDeepLinkUrl)).to.be.equal(processPath('/channel'));
	expect(_getURL('/channel//', o, cloudDeepLinkUrl)).to.be.equal(processPath('/channel'));
	expect(_getURL('/channel/123', o, cloudDeepLinkUrl)).to.be.equal(processPath('/channel/123'));
	expect(_getURL('/channel/123/', o, cloudDeepLinkUrl)).to.be.equal(processPath('/channel/123'));
	expect(_getURL('/channel/123?id=456&name=test', o, cloudDeepLinkUrl)).to.be.equal(processPath('/channel/123?id=456&name=test'));
	expect(_getURL('/channel/123/?id=456&name=test', o, cloudDeepLinkUrl)).to.be.equal(processPath('/channel/123?id=456&name=test'));
};

const getCloudUrl = (_site_url, path) => {
	path = ltrim(path, '/');
	const url = `https://go.rocket.chat/?host=${encodeURIComponent(_site_url.replace(/https?:\/\//, ''))}&path=${encodeURIComponent(path)}`;
	if (_site_url.includes('http://')) {
		return `${url}&secure=no`;
	}
	return url;
};

const testCases = (options) => {
	const _site_url = rtrim(options._site_url, '/');

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

describe('getURL as a workspace URL builder (full: true, cdn: false)', () => {
	const workspaceUrl = (path, _site_url, _root_url_path_prefix) =>
		_getURL(path, { full: true, cdn: false, _cdn_prefix: 'https://cdn.com', _site_url, _root_url_path_prefix });

	for (const [description, siteUrl, prefix, root] of [
		['without a path prefix', 'https://open.rocket.chat/', '', 'https://open.rocket.chat'],
		['with a path prefix', 'https://open.rocket.chat/chat/', '/chat', 'https://open.rocket.chat/chat'],
	]) {
		describe(description, () => {
			it('should return the site root without a trailing slash and ignore the CDN', () => {
				expect(workspaceUrl('', siteUrl, prefix)).to.equal(root);
			});

			it('should append a path', () => {
				expect(workspaceUrl('reset-password/abc', siteUrl, prefix)).to.equal(`${root}/reset-password/abc`);
				expect(workspaceUrl('/sounds/chime.mp3', siteUrl, prefix)).to.equal(`${root}/sounds/chime.mp3`);
			});

			it('should keep a hash route', () => {
				expect(workspaceUrl('#/verify-email/abc', siteUrl, prefix)).to.equal(`${root}/#/verify-email/abc`);
			});

			it('should keep a query string', () => {
				expect(workspaceUrl('direct/user?msg=abc', siteUrl, prefix)).to.equal(`${root}/direct/user?msg=abc`);
			});

			it('should drop a trailing slash from the path', () => {
				expect(workspaceUrl('_saml/logout/provider/', siteUrl, prefix)).to.equal(`${root}/_saml/logout/provider`);
			});
		});
	}
});
