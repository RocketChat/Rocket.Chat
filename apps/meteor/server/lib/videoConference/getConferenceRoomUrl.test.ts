import { before, beforeEach, describe, it } from 'node:test';

import { mockModel } from '@rocket.chat/models/testing';
import { expect } from 'chai';
import sinon from 'sinon';

import { getConferenceRoomUrl } from './getConferenceRoomUrl';
import { NEW_CONFERENCE_ID } from '../../../lib/videoConference/constants';

const cursorOf = (docs: object[]) => ({ toArray: async () => docs });

describe('getConferenceRoomUrl', () => {
	const findUrlsStartingWith = sinon.stub();
	const findActiveCustomUrlsStartingWith = sinon.stub();
	const findOneById = sinon.stub();

	let linkUrls: string[];
	let liveCustomUrls: string[];
	let conferenceIds: string[];

	before(() => {
		mockModel('VideoConferenceRooms', { findUrlsStartingWith });
		mockModel('VideoConference', { findActiveCustomUrlsStartingWith, findOneById });
	});

	beforeEach(() => {
		linkUrls = [];
		liveCustomUrls = [];
		conferenceIds = [];
		findUrlsStartingWith.reset();
		findActiveCustomUrlsStartingWith.reset();
		findOneById.reset();
		findUrlsStartingWith.callsFake(() => cursorOf(linkUrls.map((url) => ({ url }))));
		findActiveCustomUrlsStartingWith.callsFake(() => cursorOf(liveCustomUrls.map((customUrl) => ({ customUrl }))));
		findOneById.callsFake(async (_id: string) => (conferenceIds.includes(_id) ? { _id } : null));
	});

	it('returns the slug when it is free', async () => {
		expect(await getConferenceRoomUrl('  Weekly Sync  ')).to.equal('weekly-sync');
		expect(findUrlsStartingWith.firstCall.args[0]).to.equal('weekly-sync');
		expect(findActiveCustomUrlsStartingWith.firstCall.args[0]).to.equal('weekly-sync');
	});

	it('uses the lowest free suffix', async () => {
		linkUrls = ['a', 'a-2', 'a-4'];

		expect(await getConferenceRoomUrl('a')).to.equal('a-3');
	});

	it("a link's url is taken", async () => {
		linkUrls = ['weekly'];

		expect(await getConferenceRoomUrl('Weekly')).to.equal('weekly-2');
	});

	// A renamed link's old address keeps reaching its conference until that ends; a new link must not take it.
	it("a live conference's customUrl is taken", async () => {
		liveCustomUrls = ['weekly'];

		expect(await getConferenceRoomUrl('Weekly')).to.equal('weekly-2');
	});

	// An address answers a conference id first, so a link shaped like one could be shadowed by a future call.
	it('a call-id-shaped slug is taken', async () => {
		const callIdShaped = '65a1b2c3d4e5f60718293a4b';

		expect(await getConferenceRoomUrl(callIdShaped)).to.equal(`${callIdShaped}-2`);
	});

	it('an existing conference id is taken', async () => {
		conferenceIds = ['standup'];

		expect(await getConferenceRoomUrl('Standup')).to.equal('standup-2');
		expect(findOneById.firstCall.args[0]).to.equal('standup');
	});

	it('new is taken', async () => {
		expect(await getConferenceRoomUrl(NEW_CONFERENCE_ID)).to.equal(`${NEW_CONFERENCE_ID}-2`);
	});

	it('empty slug', async () => {
		for (const title of ['!!!', '   ', '']) {
			await expect(getConferenceRoomUrl(title)).to.be.rejectedWith('error-invalid-title');
		}
	});

	// A rename that keeps the slug must keep the address, even while the link's own conference is live under it.
	it("the link's own url is not a clash", async () => {
		linkUrls = ['weekly'];
		liveCustomUrls = ['weekly'];

		expect(await getConferenceRoomUrl('WEEKLY', { currentUrl: 'weekly' })).to.equal('weekly');
		expect(await getConferenceRoomUrl('Weekly', { currentUrl: 'daily' })).to.equal('weekly-2');
	});
});
