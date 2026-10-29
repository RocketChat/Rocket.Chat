import { beforeEach, describe, it } from 'node:test';

import { expect } from 'chai';
import p from 'proxyquire';
import sinon from 'sinon';

const settingsGet = sinon.stub();
const findByUsernamesIgnoringCase = sinon.stub();

const { filterXMPPJids, isXMPPServerEnabled } = p.noCallThru().load('./utils', {
	'../../settings': { settings: { get: settingsGet } },
	'@rocket.chat/models': { Users: { findByUsernamesIgnoringCase } },
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

describe('filterXMPPJids', () => {
	const holders = (users: object[]) => findByUsernamesIgnoringCase.returns({ toArray: async () => users });

	beforeEach(() => findByUsernamesIgnoringCase.reset());

	it('keeps a JID no user holds, and one a remote XMPP user holds', async () => {
		holders([{ username: 'bob@xmpp.example', xmppFederation: { version: 1, origin: 'xmpp.example' } }]);
		expect(await filterXMPPJids(['alice@xmpp.example', 'bob@xmpp.example'])).to.deep.equal(['alice@xmpp.example', 'bob@xmpp.example']);
	});

	it('drops a JID-shaped username a local user holds, whatever its case (addressing R12)', async () => {
		holders([{ username: 'Carol@Corp.Example' }]);
		expect(await filterXMPPJids(['carol@corp.example', 'alice@xmpp.example'])).to.deep.equal(['alice@xmpp.example']);
	});

	it('ignores usernames not shaped like a bare JID, without a lookup', async () => {
		expect(await filterXMPPJids(['alice', 'room/resource'])).to.deep.equal([]);
		expect(findByUsernamesIgnoringCase.called).to.be.false;
	});
});
