import { beforeEach, describe, it } from 'node:test';

import { expect } from 'chai';
import sinon from 'sinon';

import { createService, resetAll } from './testHarness';

const findOneByProviderNameAndSipAlias = sinon.stub();
const findOneLiveByScheduledConferenceId = sinon.stub();
const createGroup = sinon.stub().resolves('call1');
const setSipAliasById = sinon.stub();
const findOneById = sinon.stub();
const findOneByEmailAddress = sinon.stub();
const findRoomById = sinon.stub();
const findActiveByEmailAddresses = sinon.stub();
const addUserToRoom = sinon.stub().resolves();
const createRoom = sinon.stub().resolves({ _id: 'discussion1' });
const hasPermissionAsync = sinon.stub();
const createScheduledConference = sinon.stub();
const findScheduledConferenceById = sinon.stub();
const findScheduledConferenceBySipAlias = sinon.stub();
const setScheduledConferenceDiscussionRid = sinon.stub();

const stubs = [
	findOneByProviderNameAndSipAlias,
	findOneLiveByScheduledConferenceId,
	createGroup,
	setSipAliasById,
	findOneById,
	findOneByEmailAddress,
	findActiveByEmailAddresses,
	addUserToRoom,
	createRoom,
	hasPermissionAsync,
	createScheduledConference,
	findScheduledConferenceById,
	findScheduledConferenceBySipAlias,
	setScheduledConferenceDiscussionRid,
	findRoomById,
];

const settingValues: Record<string, unknown> = {};

const user = { _id: 'user1', name: 'User One', username: 'user.one' };
const requester = { _id: 'requester1', name: 'Requester', username: 'requester' };

const duplicateKeyError = () => new Error('E11000 duplicate key error collection');

const VideoConfService = createService({
	models: {
		VideoConference: { findOneByProviderNameAndSipAlias, findOneLiveByScheduledConferenceId, createGroup, setSipAliasById },
		Users: { findOneById, findOneByEmailAddress, findActiveByEmailAddresses },
		Rooms: { findOneById: findRoomById },
		ScheduledConferences: {
			create: createScheduledConference,
			findOneById: findScheduledConferenceById,
			findOneBySipAlias: findScheduledConferenceBySipAlias,
			setDiscussionRidById: setScheduledConferenceDiscussionRid,
		},
	},
	overrides: {
		'../../settings': { settings: { get: (key: string) => settingValues[key] } },
		'../../lib/rooms/createRoom': { createRoom },
		'../../lib/authorization/hasPermission': { hasAtLeastOnePermissionAsync: async () => true, hasPermissionAsync },
		'@rocket.chat/core-services': {
			api: { broadcast: sinon.stub().resolves() },
			ServiceClassInternal: class {
				onEvent() {
					/* no-op */
				}
			},
			Message: { saveSystemMessage: sinon.stub().resolves() },
			Room: { addUserToRoom },
		},
	},
});

let service: any;

beforeEach(() => {
	service = new VideoConfService();
	resetAll(...stubs);
	stubs.forEach((stub) => stub.resetBehavior());

	findOneByProviderNameAndSipAlias.resolves(null);
	findOneLiveByScheduledConferenceId.resolves(null);
	createGroup.resolves('call1');
	setSipAliasById.resolves();
	findOneById.callsFake(async (uid: string) => [user, requester].find(({ _id }) => _id === uid) ?? null);
	findOneByEmailAddress.resolves({ _id: 'requester1', active: true });
	findActiveByEmailAddresses.returns({ toArray: sinon.stub().resolves([]) });
	addUserToRoom.resolves();
	createRoom.resolves({ _id: 'discussion1' });
	hasPermissionAsync.resolves(true);
	createScheduledConference.resolves('booking1');
	findScheduledConferenceById.resolves(null);
	findScheduledConferenceBySipAlias.resolves(null);
	setScheduledConferenceDiscussionRid.resolves();
	findRoomById.resolves({ _id: 'parent1', t: 'c' });

	settingValues.Pexip_Integration_Enabled = true;
	settingValues.Pexip_Integration_SIP_AddAlias = true;
	settingValues.Pexip_Integration_PersistentChat_ExternalRoom = [{ _id: 'external1' }];
	settingValues.Site_Url = 'https://chat.example.com/';
});

const booking = (overrides: Record<string, unknown> = {}) => ({
	_id: 'booking1',
	uid: 'requester1',
	requesterEmail: 'requester@example.com',
	inviteeEmails: [],
	discussionRid: 'discussion1',
	createdAt: new Date('2026-11-09T00:00:00.000Z'),
	_updatedAt: new Date('2026-11-09T00:00:00.000Z'),
	...overrides,
});

describe('VideoConfService.initializeOrJoinScheduledConference', () => {
	// The alias is only meaningful while the workspace hands them out; without that there is nothing it names.
	it('should refuse when Pexip is off', async () => {
		settingValues.Pexip_Integration_Enabled = false;

		await expect(service.initializeOrJoinScheduledConference('12345678', 'user1')).to.be.rejectedWith('feature-disabled');
	});

	it('should refuse when aliases are not being handed out', async () => {
		settingValues.Pexip_Integration_SIP_AddAlias = false;

		await expect(service.initializeOrJoinScheduledConference('12345678', 'user1')).to.be.rejectedWith('feature-disabled');
	});

	it('should look the alias up scoped to the internal Pexip provider', async () => {
		await service.initializeOrJoinScheduledConference('12345678', 'user1');

		expect(findOneByProviderNameAndSipAlias.firstCall.args[0]).to.equal('core.pexip');
		expect(findOneByProviderNameAndSipAlias.firstCall.args[1]).to.equal('12345678');
	});

	describe('when the alias has never been dialled', () => {
		it('should build the conference on the room the workspace named for them', async () => {
			await service.initializeOrJoinScheduledConference('12345678', 'user1');

			expect(createGroup.firstCall.args[0]).to.include({ rid: 'external1', sipAlias: '12345678' });
		});

		// The alias is the only thing the caller supplied, so it stands in as the name until one is set.
		it('should title the conference after the alias', async () => {
			await service.initializeOrJoinScheduledConference('12345678', 'user1');

			expect(createGroup.firstCall.args[0].title).to.equal('12345678');
		});

		// `createGroup` takes the discussion, so the chat has to exist before the conference does.
		it('should create the chat first and hand it to the conference', async () => {
			await service.initializeOrJoinScheduledConference('12345678', 'user1');

			expect(createRoom.calledBefore(createGroup)).to.be.true;
			expect(createGroup.firstCall.args[0].discussionRid).to.equal('discussion1');
		});

		// Nobody is being asked to answer: whoever dials the alias arrives of their own accord.
		it('should not ring', async () => {
			await service.initializeOrJoinScheduledConference('12345678', 'user1');

			expect(createGroup.firstCall.args[0]).to.not.have.property('ringing');
		});

		it('should refuse when no room has been named for external conferences', async () => {
			settingValues.Pexip_Integration_PersistentChat_ExternalRoom = '';

			await expect(service.initializeOrJoinScheduledConference('12345678', 'user1')).to.be.rejectedWith('invalid-room');
			expect(createGroup.called).to.be.false;
		});
	});

	describe('when the alias already stands for a conference', () => {
		beforeEach(() => {
			findOneByProviderNameAndSipAlias.resolves({ _id: 'existing1', discussionRid: 'discussion9' });
		});

		it('should join that conference rather than building another', async () => {
			const callId = await service.initializeOrJoinScheduledConference('12345678', 'user1');

			expect(callId).to.equal('existing1');
			expect(createGroup.called).to.be.false;
		});

		it('should subscribe the caller to the chat that is already there', async () => {
			await service.initializeOrJoinScheduledConference('12345678', 'user1');

			expect(addUserToRoom.calledWith('discussion9', { _id: 'user1' })).to.be.true;
		});

		// Failing to subscribe somebody is not a reason to keep them out of the call.
		it('should still join when subscribing to the chat fails', async () => {
			addUserToRoom.rejects(new Error('no such room'));

			const callId = await service.initializeOrJoinScheduledConference('12345678', 'user1');

			expect(callId).to.equal('existing1');
		});

		it('should do nothing about a chat when the conference has none', async () => {
			findOneByProviderNameAndSipAlias.resolves({ _id: 'existing1' });

			await service.initializeOrJoinScheduledConference('12345678', 'user1');

			expect(addUserToRoom.called).to.be.false;
		});
	});

	// Whoever dials first, the booking decides who the conference belongs to.
	describe('when the alias was booked', () => {
		beforeEach(() => {
			findScheduledConferenceBySipAlias.resolves(booking({ sipAlias: '12345678', title: 'Weekly sync' }));
		});

		it('should build the conference on the requester, not on whoever arrived', async () => {
			await service.initializeOrJoinScheduledConference('12345678', 'user1');

			expect(createGroup.firstCall.args[0].createdBy).to.deep.equal(requester);
			expect(createGroup.firstCall.args[0]).to.include({ scheduledConferenceId: 'booking1', title: 'Weekly sync', sipAlias: '12345678' });
		});

		it('should still subscribe whoever arrived to the chat', async () => {
			await service.initializeOrJoinScheduledConference('12345678', 'user1');

			expect(addUserToRoom.calledWith('discussion1', { _id: 'user1' })).to.be.true;
		});
	});
});

describe('VideoConfService.getSchedulingOptions', () => {
	it('should allow everything when the user holds both permissions', async () => {
		expect(await service.getSchedulingOptions('requester@example.com')).to.deep.equal({ canSchedule: true, canUseSipAlias: true });
	});

	it('should allow nothing to an address no user has', async () => {
		findOneByEmailAddress.resolves(null);

		expect(await service.getSchedulingOptions('nobody@example.com')).to.deep.equal({ canSchedule: false, canUseSipAlias: false });
	});

	it('should allow nothing to a deactivated user', async () => {
		findOneByEmailAddress.resolves({ _id: 'requester1', active: false });

		expect(await service.getSchedulingOptions('requester@example.com')).to.deep.equal({ canSchedule: false, canUseSipAlias: false });
	});

	it('should allow nothing while Pexip is off', async () => {
		settingValues.Pexip_Integration_Enabled = false;

		expect(await service.getSchedulingOptions('requester@example.com')).to.deep.equal({ canSchedule: false, canUseSipAlias: false });
	});

	// A booking nobody can start a conference from would only hand out a dead link.
	it('should allow nothing while no room is named for external conferences', async () => {
		settingValues.Pexip_Integration_PersistentChat_ExternalRoom = '';

		expect(await service.getSchedulingOptions('requester@example.com')).to.deep.equal({ canSchedule: false, canUseSipAlias: false });
	});

	it('should allow nothing to a user without the scheduling permission, alias included', async () => {
		hasPermissionAsync.withArgs('requester1', 'schedule-conference').resolves(false);

		expect(await service.getSchedulingOptions('requester@example.com')).to.deep.equal({ canSchedule: false, canUseSipAlias: false });
	});

	it('should not offer an alias to a user without the alias permission', async () => {
		hasPermissionAsync.withArgs('requester1', 'schedule-conference-sip-alias').resolves(false);

		expect(await service.getSchedulingOptions('requester@example.com')).to.deep.equal({ canSchedule: true, canUseSipAlias: false });
	});

	it('should not offer an alias while the workspace hands none out', async () => {
		settingValues.Pexip_Integration_SIP_AddAlias = false;

		expect(await service.getSchedulingOptions('requester@example.com')).to.deep.equal({ canSchedule: true, canUseSipAlias: false });
	});
});

describe('VideoConfService.scheduleConference', () => {
	const request = { invitees: ['guest@example.com'], sipAlias: false, title: 'Weekly sync' };

	it('should refuse an address no user has', async () => {
		findOneByEmailAddress.resolves(null);

		await expect(service.scheduleConference('nobody@example.com', request)).to.be.rejectedWith('error-invalid-user');
		expect(createScheduledConference.called).to.be.false;
	});

	it('should refuse a user who may not schedule', async () => {
		hasPermissionAsync.withArgs('requester1', 'schedule-conference').resolves(false);

		await expect(service.scheduleConference('requester@example.com', request)).to.be.rejectedWith('error-not-allowed');
		expect(createScheduledConference.called).to.be.false;
	});

	// Booking without the alias instead would hand the add-in an invitation lacking what the user picked.
	it('should refuse an alias to a user who may not have one, booking nothing', async () => {
		hasPermissionAsync.withArgs('requester1', 'schedule-conference-sip-alias').resolves(false);

		await expect(service.scheduleConference('requester@example.com', { ...request, sipAlias: true })).to.be.rejectedWith(
			'error-not-allowed',
		);
		expect(createScheduledConference.called).to.be.false;
	});

	it('should store the request as received', async () => {
		await service.scheduleConference('Requester@Example.com', request);

		expect(createScheduledConference.firstCall.args[0]).to.deep.equal({
			uid: 'requester1',
			requesterEmail: 'Requester@Example.com',
			inviteeEmails: ['guest@example.com'],
			discussionRid: 'discussion1',
			title: 'Weekly sync',
		});
	});

	// Booked once, the chat is shared by every conference started from the booking.
	it('should create the discussion with the booking, owned by the requester and named after the title', async () => {
		await service.scheduleConference('requester@example.com', request);

		expect(createRoom.calledOnce).to.be.true;
		expect(createRoom.firstCall.args[2]).to.equal(requester);
		expect(createRoom.firstCall.args[6]).to.include({ fname: 'Weekly sync', prid: 'parent1' });
	});

	it('should give an untitled booking the usual dated discussion name', async () => {
		await service.scheduleConference('requester@example.com', { ...request, title: undefined });

		expect(createRoom.firstCall.args[6].fname).to.match(/^\d{4}-\d{2}-\d{2} Video Call Chat$/);
	});

	it('should create no discussion for a refused request', async () => {
		hasPermissionAsync.withArgs('requester1', 'schedule-conference').resolves(false);

		await expect(service.scheduleConference('requester@example.com', request)).to.be.rejectedWith('error-not-allowed');
		expect(createRoom.called).to.be.false;
	});

	it('should answer with the booking link and no alias when none was asked for', async () => {
		const invitation = await service.scheduleConference('requester@example.com', request);

		expect(invitation).to.deep.equal({ url: 'https://chat.example.com/conference/booking1?scheduled=1' });
		expect(createScheduledConference.firstCall.args[0]).to.not.have.property('sipAlias');
	});

	it('should reserve an eight-digit alias and answer with it', async () => {
		const invitation = await service.scheduleConference('requester@example.com', { ...request, sipAlias: true });

		expect(invitation.sipAlias).to.match(/^[1-9]\d{7}$/);
		expect(createScheduledConference.firstCall.args[0].sipAlias).to.equal(invitation.sipAlias);
	});

	it('should not reserve an alias a live conference holds', async () => {
		findOneByProviderNameAndSipAlias.onFirstCall().resolves({ _id: 'live1' });

		await service.scheduleConference('requester@example.com', { ...request, sipAlias: true });

		expect(findOneByProviderNameAndSipAlias.calledTwice).to.be.true;
		expect(createScheduledConference.calledOnce).to.be.true;
	});

	it('should draw again when another booking already holds the alias', async () => {
		createScheduledConference.onFirstCall().rejects(duplicateKeyError());

		const invitation = await service.scheduleConference('requester@example.com', { ...request, sipAlias: true });

		expect(createScheduledConference.calledTwice).to.be.true;
		expect(invitation.url).to.equal('https://chat.example.com/conference/booking1?scheduled=1');
	});
});

describe('VideoConfService.initializeOrJoinScheduledConferenceById', () => {
	beforeEach(() => {
		findScheduledConferenceById.resolves(booking({ inviteeEmails: ['guest@example.com'], title: 'Weekly sync' }));
	});

	it('should refuse a booking that does not exist', async () => {
		findScheduledConferenceById.resolves(null);

		await expect(service.initializeOrJoinScheduledConferenceById('missing', 'user1')).to.be.rejectedWith('invalid-scheduled-conference');
	});

	it('should refuse while Pexip is off', async () => {
		settingValues.Pexip_Integration_Enabled = false;

		await expect(service.initializeOrJoinScheduledConferenceById('booking1', 'user1')).to.be.rejectedWith('feature-disabled');
	});

	describe('when no conference is running for it', () => {
		it('should start one owned by the requester, so they are its host', async () => {
			const callId = await service.initializeOrJoinScheduledConferenceById('booking1', 'user1');

			expect(callId).to.equal('call1');
			expect(createGroup.firstCall.args[0].createdBy).to.deep.equal(requester);
			expect(createGroup.firstCall.args[0]).to.include({ rid: 'external1', providerName: 'core.pexip', scheduledConferenceId: 'booking1' });
		});

		it("should reuse the booking's discussion rather than creating one", async () => {
			findScheduledConferenceById.resolves(booking({ discussionRid: 'discussion7' }));

			await service.initializeOrJoinScheduledConferenceById('booking1', 'user1');

			expect(createRoom.called).to.be.false;
			expect(createGroup.firstCall.args[0].discussionRid).to.equal('discussion7');
		});

		it("should replace the booking's discussion when it has been deleted", async () => {
			findScheduledConferenceById.resolves(booking({ discussionRid: 'deleted9', title: 'Weekly sync' }));
			findRoomById.withArgs('deleted9').resolves(null);

			await service.initializeOrJoinScheduledConferenceById('booking1', 'user1');

			expect(createRoom.firstCall.args[2]).to.equal(requester);
			expect(createRoom.firstCall.args[6].fname).to.equal('Weekly sync');
			expect(setScheduledConferenceDiscussionRid.calledOnceWith('booking1', 'discussion1')).to.be.true;
			expect(createGroup.firstCall.args[0].discussionRid).to.equal('discussion1');
		});

		// The race used to leave the loser's freshly created discussion behind.
		it('should create no room at all when two people start it at once', async () => {
			createGroup.rejects(duplicateKeyError());
			findOneLiveByScheduledConferenceId.onSecondCall().resolves({ _id: 'winner1', discussionRid: 'discussion1' });

			await service.initializeOrJoinScheduledConferenceById('booking1', 'user1');

			expect(createRoom.called).to.be.false;
		});

		it('should title it after the booking', async () => {
			await service.initializeOrJoinScheduledConferenceById('booking1', 'user1');

			expect(createGroup.firstCall.args[0].title).to.equal('Weekly sync');
		});

		it('should fall back to the alias for a title', async () => {
			findScheduledConferenceById.resolves(booking({ sipAlias: '12345678' }));

			await service.initializeOrJoinScheduledConferenceById('booking1', 'user1');

			expect(createGroup.firstCall.args[0].title).to.equal('12345678');
		});

		// An empty title is what any untitled conference has: its room names it.
		it('should leave the title empty when the booking has neither', async () => {
			findScheduledConferenceById.resolves(booking());

			await service.initializeOrJoinScheduledConferenceById('booking1', 'user1');

			expect(createGroup.firstCall.args[0].title).to.equal('');
		});

		it('should carry the reserved alias', async () => {
			findScheduledConferenceById.resolves(booking({ sipAlias: '12345678' }));

			await service.initializeOrJoinScheduledConferenceById('booking1', 'user1');

			expect(createGroup.firstCall.args[0].sipAlias).to.equal('12345678');
		});

		// The requester asked for no number, whatever the workspace does for other conferences.
		it('should give a booking without an alias none', async () => {
			await service.initializeOrJoinScheduledConferenceById('booking1', 'user1');

			expect(createGroup.firstCall.args[0].sipAlias).to.be.undefined;
			expect(setSipAliasById.called).to.be.false;
		});

		it('should subscribe the invitees who have accounts, and whoever arrived', async () => {
			findActiveByEmailAddresses.returns({ toArray: sinon.stub().resolves([{ _id: 'guest1' }]) });

			await service.initializeOrJoinScheduledConferenceById('booking1', 'user1');

			expect(findActiveByEmailAddresses.firstCall.args[0]).to.deep.equal(['guest@example.com']);
			expect(addUserToRoom.calledWith('discussion1', { _id: 'guest1' })).to.be.true;
			expect(addUserToRoom.calledWith('discussion1', { _id: 'user1' })).to.be.true;
		});

		it('should not ring', async () => {
			await service.initializeOrJoinScheduledConferenceById('booking1', 'user1');

			expect(createGroup.firstCall.args[0]).to.not.have.property('ringing');
		});

		it('should join the conference that won when two people start it at once', async () => {
			createGroup.rejects(duplicateKeyError());
			findOneLiveByScheduledConferenceId.onSecondCall().resolves({ _id: 'winner1', discussionRid: 'discussion9' });

			const callId = await service.initializeOrJoinScheduledConferenceById('booking1', 'user1');

			expect(callId).to.equal('winner1');
			expect(addUserToRoom.calledWith('discussion9', { _id: 'user1' })).to.be.true;
		});

		it('should refuse when the requester no longer exists', async () => {
			findScheduledConferenceById.resolves(booking({ uid: 'deleted1' }));

			await expect(service.initializeOrJoinScheduledConferenceById('booking1', 'user1')).to.be.rejectedWith('invalid-user');
			expect(createGroup.called).to.be.false;
		});
	});

	describe('when a conference is running for it', () => {
		beforeEach(() => {
			findOneLiveByScheduledConferenceId.resolves({ _id: 'existing1', discussionRid: 'discussion9' });
		});

		it('should join it rather than starting another', async () => {
			const callId = await service.initializeOrJoinScheduledConferenceById('booking1', 'user1');

			expect(callId).to.equal('existing1');
			expect(createGroup.called).to.be.false;
			expect(addUserToRoom.calledWith('discussion9', { _id: 'user1' })).to.be.true;
		});
	});
});

describe('VideoConfService.initializeScheduledConferenceBySipAlias', () => {
	it('should do nothing for an alias nobody booked', async () => {
		expect(await service.initializeScheduledConferenceBySipAlias('12345678')).to.be.null;
		expect(createGroup.called).to.be.false;
	});

	// A SIP endpoint has no Rocket.Chat user to subscribe; the conference is still the requester's.
	it('should start the booked conference on the requester alone', async () => {
		findScheduledConferenceBySipAlias.resolves(booking({ sipAlias: '12345678' }));

		const callId = await service.initializeScheduledConferenceBySipAlias('12345678');

		expect(callId).to.equal('call1');
		expect(createGroup.firstCall.args[0].createdBy).to.deep.equal(requester);
		expect(addUserToRoom.called).to.be.false;
	});

	it('should do nothing while Pexip is off', async () => {
		settingValues.Pexip_Integration_Enabled = false;
		findScheduledConferenceBySipAlias.resolves(booking({ sipAlias: '12345678' }));

		expect(await service.initializeScheduledConferenceBySipAlias('12345678')).to.be.null;
	});
});
