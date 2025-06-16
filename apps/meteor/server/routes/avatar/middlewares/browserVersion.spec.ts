import { expect } from 'chai';
import { describe, it } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

// const getCookie = sinon.stub();
class CookiesMock {
	public get = (_key: any, value: any) => value;
}
const { handleBrowserVersionCheck, isIEOlderThan11 } = proxyquire.noCallThru().load('./browserVersion', {
	'meteor/ostrio:cookies': {
		Cookies: CookiesMock,
	},
	'../../../../app/utils/server/getURL': {
		getURL: () => '',
	},
});

describe('#isIEOlderThan11()', () => {
	it('should return false if user agent is IE11', () => {
		const userAgent = {
			browser: {
				name: 'IE',
				version: '11.0',
			},
		};
		expect(isIEOlderThan11(userAgent)).to.be.false;
	});

	it('should return true if user agent is IE < 11', () => {
		const userAgent = {
			browser: {
				name: 'IE',
				version: '10.0',
			},
		};
		expect(isIEOlderThan11(userAgent)).to.be.true;
	});
});

describe('#handleBrowserVersionCheck()', () => {
	it('should call next if browser_version_check cookie is set to "bypass"', async () => {
		const next = sinon.spy();
		const request = {
			headers: {
				cookie: 'bypass',
			},
		};
		handleBrowserVersionCheck(request as any, {} as any, next);

		expect(next.calledOnce).to.be.true;
	});

	it('should call next if browser_version_check cookie is not set to "force" and user agent is not IE < 11', async () => {
		const next = sinon.spy();
		const request = {
			headers: {
				'cookie': 'anything',
				'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
			},
		};
		handleBrowserVersionCheck(request as any, {} as any, next);

		expect(next.calledOnce).to.be.true;
	});

	it('should respond with Browser not supported', async () => {
		const next = sinon.spy();
		const request = {
			headers: {
				'cookie': 'anything',
				'user-agent': 'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 7.0; InfoPath.3; .NET CLR 3.1.40767; Trident/6.0; en-IN)',
			},
		};

		const response = {
			setHeader: sinon.spy(),
			write: sinon.spy(),
			end: sinon.spy(),
		};
		handleBrowserVersionCheck(request as any, response as any, next);

		expect(response.setHeader.calledWith('content-type', 'text/html; charset=utf-8')).to.be.true;
		expect(response.write.calledWith(sinon.match('Browser not supported'))).to.be.true;
		expect(response.end.calledOnce).to.be.true;
	});
});
