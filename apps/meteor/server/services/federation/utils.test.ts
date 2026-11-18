import { beforeEach, describe, it } from 'node:test';

import { expect } from 'chai';
import p from 'proxyquire';
import sinon from 'sinon';

const settingsGet = sinon.stub();

const { isXMPPServerEnabled } = p.noCallThru().load('./utils', {
	'../../settings': { settings: { get: settingsGet } },
});

describe('isXMPPServerEnabled', () => {
	const given = (enabled: boolean, domain: string) => {
		settingsGet.withArgs('XMPP_Server_Enabled').returns(enabled);
		settingsGet.withArgs('XMPP_Server_Domain').returns(domain);
	};

	beforeEach(() => settingsGet.reset());

	it('is enabled with a domain the server can serve', () => {
		given(true, 'chat.example.com');
		expect(isXMPPServerEnabled()).to.be.true;
	});

	it('is enabled with a padded domain, which the server trims', () => {
		given(true, ' chat.example.com ');
		expect(isXMPPServerEnabled()).to.be.true;
	});

	['', '   ', 'exa mple.com', 'chat..example.com'].forEach((domain) => {
		it(`is disabled with the domain ${JSON.stringify(domain)}, which the server refuses`, () => {
			given(true, domain);
			expect(isXMPPServerEnabled()).to.be.false;
		});
	});

	it('is disabled when the toggle is off', () => {
		given(false, 'chat.example.com');
		expect(isXMPPServerEnabled()).to.be.false;
	});
});
