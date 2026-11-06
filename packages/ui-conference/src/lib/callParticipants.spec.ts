import {
	areAllGuestsMuted,
	canOfferControl,
	composeCallParticipants,
	matchesConferenceMember,
	resolveParticipant,
} from './callParticipants';
import type { PluginFeature, PluginParticipant, PluginSelf } from './providerPlugin';
import { buildConferenceMember } from '../fixtures/testFixtures';

const buildParticipant = (overrides: Partial<PluginParticipant> & Pick<PluginParticipant, 'uuid'>): PluginParticipant => ({
	displayName: `Name of ${overrides.uuid}`,
	isWaiting: false,
	isHost: false,
	isMuted: false,
	isClientMuted: false,
	isCameraMuted: false,
	isPresenting: false,
	isSpotlight: false,
	raisedHand: false,
	...overrides,
	can: {
		control: false,
		mute: false,
		disconnect: false,
		transfer: false,
		spotlight: false,
		fecc: false,
		raiseHand: false,
		changeLayout: false,
		...overrides.can,
	},
});

const featuresOf = (...features: PluginFeature[]): ReadonlySet<PluginFeature> => new Set(features);

/**
 * Identifying somebody by the name they are showing under is the weakest thing the panel does, and it is
 * deliberately the last resort rather than the intended one: two people share a name and a guest types
 * whatever they like. It stays because it is the only identity that exists at all for someone who never came
 * through Rocket.Chat — a SIP dial-in, a guest who opened the provider's own address — and for anyone else in
 * the moment before a stronger one is known.
 */
describe('matchesConferenceMember', () => {
	const member = buildConferenceMember({ _id: 'ada', username: 'ada', name: 'Ada Lovelace' });

	it('matches the username the provider was given', () => {
		expect(matchesConferenceMember('ada', member)).toBe(true);
	});

	it('matches the real name, which is what the window sends when the workspace shows real names', () => {
		expect(matchesConferenceMember('Ada Lovelace', member)).toBe(true);
	});

	// The provider decides how it stores and echoes the name it was handed, and a participant typing their own
	// name into a prejoin screen decides nothing about its case or its spacing.
	it('ignores case and surrounding space', () => {
		expect(matchesConferenceMember('  ADA lovelace ', member)).toBe(true);
	});

	it('matches nobody else', () => {
		expect(matchesConferenceMember('Grace Hopper', member)).toBe(false);
	});

	// Pexip has no name for some participants — a dial-in, a device — and sends the empty string. A member
	// without a real name set has an empty `name`, so a plain comparison pairs the two and puts a stranger's
	// controls under that member's face.
	it('matches nobody at all when the provider has no name for someone', () => {
		const unnamed = buildConferenceMember({ _id: 'no-name', username: '', name: '' });

		expect(matchesConferenceMember('', unnamed)).toBe(false);
		expect(matchesConferenceMember('   ', unnamed)).toBe(false);
	});
});

/**
 * Turning a participant into a person, which is what decides whose face a mute button ends up under.
 *
 * The uuid is what every request is addressed by; the name is only ever asked whether it agrees. Neither on its
 * own is allowed to settle it — the claim because a member's window reports it and nothing can check that
 * against the provider, the name because two people share one.
 */
describe('resolveParticipant', () => {
	const ada = buildConferenceMember({ _id: 'ada', username: 'ada', name: 'Ada Lovelace' });
	const grace = buildConferenceMember({ _id: 'grace', username: 'grace', name: 'Grace Hopper' });

	it('resolves a member who claims the uuid and wears the name to go with it', () => {
		const claiming = { ...grace, providerParticipantId: 'p1' };

		expect(resolveParticipant(buildParticipant({ uuid: 'p1', displayName: 'Grace Hopper' }), [ada, claiming])).toBe(claiming);
	});

	// A stale or wrong id, corroborated by nothing. Going on to match the name would turn it into a confident
	// misattribution rather than leaving it as the unanswered question it is.
	it('resolves nobody for a claim the name contradicts, rather than looking for a better fit', () => {
		const claiming = { ...grace, providerParticipantId: 'p1' };

		expect(resolveParticipant(buildParticipant({ uuid: 'p1', displayName: 'Ada Lovelace' }), [ada, claiming])).toBeUndefined();
	});

	it('falls back to the name where nobody claims the uuid', () => {
		expect(resolveParticipant(buildParticipant({ uuid: 'p1', displayName: 'Grace Hopper' }), [ada, grace])).toBe(grace);
	});

	// Not a weak match but a coin toss, and losing it puts one person's microphone under another's face.
	it('resolves nobody where two members wear the name and nothing separates them', () => {
		const twin = buildConferenceMember({ _id: 'twin', username: 'twin', name: 'Grace Hopper' });

		expect(resolveParticipant(buildParticipant({ uuid: 'p1', displayName: 'Grace Hopper' }), [grace, twin])).toBeUndefined();
	});

	it('resolves the one of two namesakes who claims the uuid', () => {
		const twin = { ...buildConferenceMember({ _id: 'twin', username: 'twin', name: 'Grace Hopper' }), providerParticipantId: 'p1' };

		expect(resolveParticipant(buildParticipant({ uuid: 'p1', displayName: 'Grace Hopper' }), [grace, twin])).toBe(twin);
	});

	// Everyone who arrived at the provider without passing through Rocket.Chat, which no identity of ours will
	// ever cover.
	it('resolves nobody for a participant wearing a name no member of the conference has', () => {
		expect(resolveParticipant(buildParticipant({ uuid: 'p2', displayName: 'Someone Else' }), [ada, grace])).toBeUndefined();
	});

	it('resolves nobody for a participant the provider has no name for', () => {
		const nameless = buildConferenceMember({ _id: 'nameless', username: '', name: '' });

		expect(resolveParticipant(buildParticipant({ uuid: 'p3', displayName: '' }), [nameless, ada])).toBeUndefined();
	});

	it('considers only the members it was offered', () => {
		expect(resolveParticipant(buildParticipant({ uuid: 'p3', displayName: 'ada' }), [grace])).toBeUndefined();
	});
});

/**
 * The rule the whole exercise is for. The protocol carries no replies: a request the provider refuses is a 403
 * logged in a console this window cannot read, so a control that shouldn't be offered is a button that does
 * nothing at all, every time it is pressed.
 */
describe('canOfferControl', () => {
	const participant = buildParticipant({ uuid: 'p1', can: { mute: true, disconnect: true } as PluginParticipant['can'] });
	const host = { canControl: true } as PluginSelf;
	const guest = { canControl: false } as PluginSelf;

	it('offers a control the provider announced and the participant allows', () => {
		expect(canOfferControl('mute', participant, featuresOf('mute'), host)).toBe(true);
	});

	it('withholds one the provider never announced, however the participant is flagged', () => {
		expect(canOfferControl('mute', participant, featuresOf('roster'), host)).toBe(false);
	});

	it('withholds one the participant refuses, however the provider is configured', () => {
		expect(canOfferControl('spotlight', participant, featuresOf('spotlight'), host)).toBe(false);
	});

	// `can.*` describes the subject, never the viewer's authority over them: it says who may be muted, not by
	// whom. A guest reading the panel was offered every one of these, and every press would have come back 403.
	describe('for a viewer who does not control the conference', () => {
		it('withholds everything that acts on somebody else', () => {
			expect(canOfferControl('mute', participant, featuresOf('mute'), guest)).toBe(false);
			expect(canOfferControl('disconnect', participant, featuresOf('disconnect'), guest)).toBe(false);
			expect(canOfferControl('spotlight', participant, featuresOf('spotlight'), guest)).toBe(false);
			expect(canOfferControl('set-role', participant, featuresOf('set-role'), guest)).toBe(false);
			expect(canOfferControl('admit', participant, featuresOf('admit'), guest)).toBe(false);
			expect(canOfferControl('raise-hand', participant, featuresOf('raise-hand'), guest)).toBe(false);
		});

		// Leaving and raising your own hand are nobody's to grant.
		it('still lets them leave and raise their own hand', () => {
			const mine = buildParticipant({ uuid: 'me', can: { disconnect: true, raiseHand: true } as PluginParticipant['can'] });

			expect(canOfferControl('disconnect', mine, featuresOf('disconnect'), guest, true)).toBe(true);
			expect(canOfferControl('raise-hand', mine, featuresOf('raise-hand'), guest, true)).toBe(true);
		});

		// Their own row is not a way around it either: spotlighting is a host's act wherever it is pointed.
		it('does not let them spotlight themselves', () => {
			const mine = buildParticipant({ uuid: 'me', can: { spotlight: true } as PluginParticipant['can'] });

			expect(canOfferControl('spotlight', mine, featuresOf('spotlight'), guest, true)).toBe(false);
		});
	});

	// Nothing is offerable before `ready`, which is what an empty feature set means.
	it('offers nothing at all until the provider has announced anything', () => {
		expect(canOfferControl('disconnect', participant, featuresOf())).toBe(false);
	});

	// Promoting and dialling digits are not per-participant powers in the provider's model: they are what
	// someone controlling the conference may do to anyone in it. Both are only ever offered against people
	// already in the call, where the subject's own `control` flag is a fair stand-in for the lack of one.
	// `set-role` moved onto the viewer for the same reason `admit` did — see the describe below.
	it('offers nothing a provider has not announced, whatever the viewer controls', () => {
		expect(canOfferControl('set-role', participant, featuresOf(), { canControl: true } as PluginSelf)).toBe(false);
	});

	// The one that bit: a participant still in the lobby is not in the conference for anyone to have control
	// over, so the provider reports `canControl` false for them. Standing `admit` on that flag withheld the
	// admit button from every person it exists for, leaving only the reject beside them.
	describe('admit', () => {
		const waiting = buildParticipant({ uuid: 'p-waiting', isWaiting: true, can: { control: false } as PluginParticipant['can'] });
		const features = featuresOf('admit');

		it('is offered to a viewer who controls the conference, whatever the lobby says about the subject', () => {
			expect(canOfferControl('admit', waiting, features, { canControl: true } as PluginSelf)).toBe(true);
		});

		it('is withheld from a viewer who does not control the conference', () => {
			expect(canOfferControl('admit', waiting, features, { canControl: false } as PluginSelf)).toBe(false);
		});

		// `self` only arrives once the provider has said who the viewer is, and until then nothing is known.
		it('is withheld while the viewer is unknown', () => {
			expect(canOfferControl('admit', waiting, features)).toBe(false);
		});
	});
});

describe('areAllGuestsMuted', () => {
	it('is true once every guest in the call is muted', () => {
		expect(
			areAllGuestsMuted([
				buildParticipant({ uuid: 'host', isHost: true }),
				buildParticipant({ uuid: 'one', isMuted: true }),
				buildParticipant({ uuid: 'two', isMuted: true }),
			]),
		).toBe(true);
	});

	it('is false while any of them is not', () => {
		expect(areAllGuestsMuted([buildParticipant({ uuid: 'one', isMuted: true }), buildParticipant({ uuid: 'two' })])).toBe(false);
	});

	// A conference of hosts has nothing to offer to unmute, and the button would sit there claiming everyone is
	// already silent.
	it('is false when there are no guests to have muted', () => {
		expect(areAllGuestsMuted([buildParticipant({ uuid: 'host', isHost: true })])).toBe(false);
	});

	// Someone in the lobby is not in the call, so their state says nothing about whether the room is quiet.
	it('ignores whoever is still waiting to be let in', () => {
		expect(areAllGuestsMuted([buildParticipant({ uuid: 'in', isMuted: true }), buildParticipant({ uuid: 'lobby', isWaiting: true })])).toBe(
			true,
		);
	});
});

describe('composeCallParticipants', () => {
	const ada = buildConferenceMember({ _id: 'ada', username: 'ada', name: 'Ada Lovelace' });
	const grace = buildConferenceMember({ _id: 'grace', username: 'grace', name: 'Grace Hopper', joined: false });

	// The panel without a plugin, which is every provider that doesn't speak this protocol and every call that
	// hasn't connected yet: the groups are exactly what our own membership says, and no row can do anything.
	it('is our own members, grouped as the conference has them, when the provider says nothing', () => {
		const { waiting, present, absent } = composeCallParticipants([ada, grace], []);

		expect(waiting).toEqual([]);
		expect(present).toEqual([{ key: 'ada', member: ada, participant: undefined }]);
		expect(absent).toEqual([{ key: 'grace', member: grace, participant: undefined }]);
	});

	it('hands a member the controls of the participant resolved to them', () => {
		const participant = buildParticipant({ uuid: 'p-ada', displayName: 'Ada Lovelace' });

		const { present } = composeCallParticipants([ada], [participant]);

		expect(present).toEqual([{ key: 'ada', member: ada, participant }]);
	});

	// A guest with a link, a dial-in, anyone who arrived by an address rather than an invitation.
	it('shows a participant matching nobody as their own row, under the name the provider gave', () => {
		const stranger = buildParticipant({ uuid: 'p-stranger', displayName: 'Someone Else' });

		const { present } = composeCallParticipants([ada], [stranger]);

		expect(present).toEqual([
			{ key: 'ada', member: ada, participant: undefined },
			{ key: 'provider:p-stranger', participant: stranger },
		]);
	});

	// Being let in is the only thing anyone can do about someone in the lobby, and a member sitting under "in
	// the call" would be offered a ring instead.
	it('lifts whoever is waiting in the lobby out of their own group, member or not', () => {
		const waitingMember = buildParticipant({ uuid: 'p-ada', displayName: 'ada', isWaiting: true });
		const waitingStranger = buildParticipant({ uuid: 'p-guest', displayName: 'Guest', isWaiting: true });

		const { waiting, present, absent } = composeCallParticipants([ada], [waitingMember, waitingStranger]);

		expect(waiting).toEqual([
			{ key: 'ada', member: ada, participant: waitingMember },
			{ key: 'provider:p-guest', participant: waitingStranger },
		]);
		expect(present).toEqual([]);
		expect(absent).toEqual([]);
	});

	// Our membership is the record of who was asked and the provider's is who is connected now, so they drift
	// apart in both directions. Each keeps what it is the authority on rather than one erasing the other.
	describe('when the two disagree', () => {
		it('keeps a member the conference still has in the call, with nothing to press', () => {
			const { present } = composeCallParticipants([ada], []);

			expect(present).toEqual([{ key: 'ada', member: ada, participant: undefined }]);
		});

		it('leaves a member the conference has not caught up with where it has them, controls and all', () => {
			const participant = buildParticipant({ uuid: 'p-grace', displayName: 'grace' });

			const { present, absent } = composeCallParticipants([grace], [participant]);

			expect(present).toEqual([]);
			expect(absent).toEqual([{ key: 'grace', member: grace, participant }]);
		});
	});

	// Claims are read first whatever order the provider listed the call in, so the member a uuid settles is also
	// what leaves the other namesake unambiguous — rather than the first row read winning the coin toss.
	it('lets a claim settle which of two namesakes is which, whichever is listed first', () => {
		const first = buildConferenceMember({ _id: 'first', username: 'first', name: 'Grace Hopper' });
		const second = { ...buildConferenceMember({ _id: 'second', username: 'second', name: 'Grace Hopper' }), providerParticipantId: 'p-2' };

		const unclaimed = buildParticipant({ uuid: 'p-1', displayName: 'Grace Hopper' });
		const claimed = buildParticipant({ uuid: 'p-2', displayName: 'Grace Hopper' });

		const { present } = composeCallParticipants([first, second], [unclaimed, claimed]);

		expect(present).toEqual([
			{ key: 'first', member: first, participant: unclaimed },
			{ key: 'second', member: second, participant: claimed },
		]);
	});

	// Display names are not unique, and one member cannot be two people in the call.
	it('gives two participants sharing a name two rows rather than one', () => {
		const first = buildParticipant({ uuid: 'p-1', displayName: 'Ada Lovelace' });
		const second = buildParticipant({ uuid: 'p-2', displayName: 'Ada Lovelace' });

		const { present } = composeCallParticipants([ada], [first, second]);

		expect(present).toEqual([
			{ key: 'ada', member: ada, participant: first },
			{ key: 'provider:p-2', participant: second },
		]);
	});

	// The plugin sends `''` for a participant Pexip has no name for, and a member with no real name set has an
	// empty `name` — pairing the two would put a dial-in's controls under that member's face.
	it('never pairs an unnamed participant with anyone', () => {
		const nameless = buildConferenceMember({ _id: 'nameless', username: '', name: '' });
		const unnamed = buildParticipant({ uuid: 'p-phone', displayName: '' });

		const { present } = composeCallParticipants([nameless], [unnamed]);

		expect(present).toEqual([
			{ key: 'nameless', member: nameless, participant: undefined },
			{ key: 'provider:p-phone', participant: unnamed },
		]);
	});
});
