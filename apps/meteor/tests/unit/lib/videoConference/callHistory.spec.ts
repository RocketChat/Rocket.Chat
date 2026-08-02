import type { IGroupVideoConference, IVideoConferenceUser } from '@rocket.chat/core-typings';
import { expect } from 'chai';

import { buildConferenceCallHistoryItems } from '../../../../lib/videoConference/callHistory';

const createdBy = { _id: 'creator', username: 'creator.user', name: 'Creator User' };

const buildMember = (overrides: Partial<IVideoConferenceUser> & Pick<IVideoConferenceUser, '_id'>): IVideoConferenceUser => ({
	username: `${overrides._id}.user`,
	name: overrides._id,
	avatarETag: null,
	ts: new Date('2026-01-01T00:00:00.000Z'),
	...overrides,
});

const buildCall = (
	users: IVideoConferenceUser[],
	overrides: Partial<Pick<IGroupVideoConference, 'title' | 'rid' | '_id' | 'createdAt'>> = {},
): Pick<IGroupVideoConference, '_id' | 'rid' | 'title' | 'createdAt' | 'createdBy' | 'users'> => ({
	_id: 'call1',
	rid: 'room1',
	title: 'Sprint planning',
	createdAt: new Date('2026-01-01T00:00:00.000Z'),
	createdBy,
	users,
	...overrides,
});

describe('buildConferenceCallHistoryItems', () => {
	it('should return no items for a conference with no members', () => {
		expect(buildConferenceCallHistoryItems(buildCall([]))).to.have.length(0);
	});

	it('should mark the creator outbound and every other member inbound', () => {
		const call = buildCall([buildMember({ _id: 'creator', joined: true }), buildMember({ _id: 'other', joined: true })]);

		const items = buildConferenceCallHistoryItems(call);

		expect(items.find((item) => item.uid === 'creator')).to.have.property('direction', 'outbound');
		expect(items.find((item) => item.uid === 'other')).to.have.property('direction', 'inbound');
	});

	it('should mark a member who declined and never joined as not-answered', () => {
		const call = buildCall([buildMember({ _id: 'decliner', joined: false, declined: true, declinedAt: new Date() })]);

		const [item] = buildConferenceCallHistoryItems(call);

		expect(item).to.have.property('state', 'not-answered');
	});

	it('should mark a member who joined as ended, even if they declined earlier', () => {
		const call = buildCall([
			buildMember({ _id: 'changedMind', joined: true, joinedAt: new Date(), declined: true, declinedAt: new Date() }),
		]);

		const [item] = buildConferenceCallHistoryItems(call);

		expect(item).to.have.property('state', 'ended');
	});

	// Being added rings you, so ignoring it is a missed call just as much as declining is.
	it('should mark a member who was added but never joined as not-answered', () => {
		const call = buildCall([buildMember({ _id: 'ignoredInvite', joined: false })]);

		const [item] = buildConferenceCallHistoryItems(call);

		expect(item).to.have.property('state', 'not-answered');
	});

	// Entries written before the `joined` flag existed have it absent, which `hasJoinedVideoConference` reads
	// as joined — so a historical conference must not retroactively report its members as having missed it.
	it('should treat a member with no joined flag as having joined', () => {
		const call = buildCall([buildMember({ _id: 'legacyMember', declined: true, declinedAt: new Date() })]);

		const [item] = buildConferenceCallHistoryItems(call);

		expect(item).to.have.property('state', 'ended');
	});

	it('should count only members who joined, not every member', () => {
		const call = buildCall([
			buildMember({ _id: 'joinedOne', joined: true }),
			buildMember({ _id: 'joinedTwo', joined: true }),
			buildMember({ _id: 'neverJoined', joined: false }),
		]);

		const items = buildConferenceCallHistoryItems(call);

		expect(items.every((item) => item.usersCount === 2)).to.be.true;
	});

	it('should carry the conference room, call id and title over to every item', () => {
		const call = buildCall([buildMember({ _id: 'creator', joined: true })], { title: 'Weekly sync', rid: 'roomX', _id: 'callX' });

		const [item] = buildConferenceCallHistoryItems(call);

		expect(item).to.include({ rid: 'roomX', callId: 'callX', title: 'Weekly sync', type: 'video-conference' });
	});

	it('should omit the title when the conference has none', () => {
		const call = buildCall([buildMember({ _id: 'creator', joined: true })], { title: '' });

		const [item] = buildConferenceCallHistoryItems(call);

		expect(item).to.not.have.property('title');
	});

	it('should stamp every item with the conference start time', () => {
		const startedAt = new Date('2026-02-15T10:00:00.000Z');
		const call = buildCall([buildMember({ _id: 'creator', joined: true })], { createdAt: startedAt });

		const [item] = buildConferenceCallHistoryItems(call);

		expect(item.ts).to.equal(startedAt);
	});
});
