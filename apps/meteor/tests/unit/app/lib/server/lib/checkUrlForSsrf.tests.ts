import { expect } from 'chai';
import p from 'proxyquire';
import Sinon from 'sinon';

const lookupMock = Sinon.stub();
const dnsLookup = (host: string, cb: (...args: any[]) => any) => {
	return cb(null, lookupMock(host));
};

const { checkUrlForSsrf } = p.noCallThru().load('../../../../../../app/lib/server/functions/checkUrlForSsrf.ts', {
	dns: {
		lookup: dnsLookup,
	},
});

describe('checkUrlForSsrf', () => {
	beforeEach(() => {
		lookupMock.reset();
	});
	it('should return false if the URL does not start with http:// or https://', async () => {
		const result = await checkUrlForSsrf('ftp://example.com');
		expect(result).to.be.false;
	});

	it('should return false if the domain is not valid', async () => {
		const result = await checkUrlForSsrf('https://www_google_com');
		expect(result).to.be.false;
	});

	it('should return false if the IP is not in a valid IPv4 format', async () => {
		const result = await checkUrlForSsrf('https://127.1');
		expect(result).to.be.false;
	});

	it('should return false if the IP is in a restricted range', async () => {
		const result = await checkUrlForSsrf('http://127.0.0.1');
		expect(result).to.be.false;
	});

	it('should return false if the domain is metadata.google.internal', async () => {
		const result = await checkUrlForSsrf('http://metadata.google.internal');
		expect(result).to.be.false;
	});

	it('should return false if DNS resolves to an IP in the restricted range', async () => {
		lookupMock.returns('127.0.0.1');
		const result = await checkUrlForSsrf('http://169.254.169.254.nip.io');
		expect(result).to.be.false;
	});

	it('should return true if valid domain', async () => {
		lookupMock.returns('216.58.214.174');
		const result = await checkUrlForSsrf('https://www.google.com/');
		expect(result).to.be.true;
	});

	it('should return true if valid IP', async () => {
		const result = await checkUrlForSsrf('http://216.58.214.174');
		expect(result).to.be.true;
	});

	it('should return true if valid URL', async () => {
		lookupMock.returns('216.58.214.174');
		const result = await checkUrlForSsrf(
			'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Cat_August_2010-4.jpg/2560px-Cat_August_2010-4.jpg',
		);
		expect(result).to.be.true;
	});
});
