import { isInVideoConference } from '@rocket.chat/core-typings';

import type { ConferenceMember } from '../hooks/useConferenceEmbedded';
import type { PluginFeature, PluginParticipant, PluginSelf } from '../hooks/useProviderPlugin';

/**
 * A row of the people panel: someone the conference knows about, someone the provider has in the call, or —
 * once they have been matched — both.
 */
export type CallParticipantEntry = {
	/** Unique within the panel and stable while the person is in it. */
	key: string;
	member?: ConferenceMember;
	participant?: PluginParticipant;
};

/** The people panel's three groups, in the order it shows them. */
export type CallParticipantGroups = {
	waiting: CallParticipantEntry[];
	present: CallParticipantEntry[];
	absent: CallParticipantEntry[];
};

/** Each control the panel offers, named as the protocol names it. */
export type CallParticipantControl = 'mute' | 'mute-video' | 'admit' | 'disconnect' | 'spotlight' | 'set-role' | 'raise-hand';

type ControlRequirement = {
	feature: PluginFeature;
	/** The subject's own flag, where the provider keeps one for this. */
	flag?: keyof PluginParticipant['can'];
	/** Acting on somebody else with it takes standing in the conference. */
	hostOnly?: boolean;
	/** And this one a participant may still do to themselves without any. */
	ownable?: boolean;
};

/**
 * What has to be true before a control is worth offering.
 *
 * Three questions, and keeping them apart is the whole of this table, because conflating the first two was wrong
 * twice already.
 *
 * **What the provider supports.** A feature it never announced has nothing listening for the request.
 *
 * **What the viewer may do.** Muting, disconnecting, spotlighting, promoting and admitting are a host's, and
 * `can.*` does not answer this: those flags describe the subject, not your authority over them. `canControl` in
 * particular means *they* control the conference — reading it as "you may control this person" put Make host on
 * hosts only and Admit on nobody at all. A guest reading this panel must not be offered any of them.
 *
 * **What may be done to the subject.** This is what `can.*` is for, and the provider is the only honest source:
 * it says per participant who may be muted, spotlit or hung up on, whatever the viewer's rights.
 *
 * `ownable` is the narrow exception: leaving and raising a hand are yours to do to yourself with no standing at
 * all. They are still host-only against anybody else — taking someone else's hand down is a host's act, and so
 * is hanging up on them.
 */
const CONTROL_REQUIREMENTS: Record<CallParticipantControl, ControlRequirement> = {
	'mute': { feature: 'mute', flag: 'mute', hostOnly: true },
	'mute-video': { feature: 'mute-video', flag: 'mute', hostOnly: true },
	'admit': { feature: 'admit', hostOnly: true },
	'disconnect': { feature: 'disconnect', flag: 'disconnect', hostOnly: true, ownable: true },
	'spotlight': { feature: 'spotlight', flag: 'spotlight', hostOnly: true },
	'raise-hand': { feature: 'raise-hand', flag: 'raiseHand', hostOnly: true, ownable: true },
	'set-role': { feature: 'set-role', hostOnly: true },
};

/**
 * Whether a control is worth offering at all.
 *
 * Every half has to allow it, because nothing answers a request: a refusal is a 403 in a console this window
 * cannot read, and the only sign of one would be the next roster looking exactly like the last. A control
 * offered against any of the three is a button that silently does nothing, every time.
 */
export const canOfferControl = (
	control: CallParticipantControl,
	participant: PluginParticipant,
	features: ReadonlySet<PluginFeature>,
	self?: PluginSelf,
	isSelf = false,
): boolean => {
	const { feature, flag, hostOnly, ownable } = CONTROL_REQUIREMENTS[control];

	if (!features.has(feature)) {
		return false;
	}

	if (hostOnly && !(ownable && isSelf) && !self?.canControl) {
		return false;
	}

	return flag ? participant.can[flag] : true;
};

/**
 * Whether every guest the provider has in the call is already muted, which is what the call-wide toggle offers
 * to undo. Nobody to mute is not everybody muted.
 */
export const areAllGuestsMuted = (participants: PluginParticipant[]): boolean => {
	const guests = participants.filter(({ isHost, isWaiting }) => !isHost && !isWaiting);

	return guests.length > 0 && guests.every(({ isMuted }) => isMuted);
};

const normalizeName = (name: string | undefined): string => name?.trim().toLowerCase() ?? '';

/**
 * Whether the name the provider gave a participant is this member's.
 *
 * The provider is handed the viewer's display name when the call window sends them to it, which is what makes
 * the name worth comparing at all. An empty one is not a weak match but no match: pairing it with a member who
 * has no username or no real name set would put a nameless dial-in under somebody else's face.
 */
export const matchesConferenceMember = (displayName: string, member: Pick<ConferenceMember, 'username' | 'name'>): boolean => {
	const name = normalizeName(displayName);

	if (!name) {
		return false;
	}

	return name === normalizeName(member.username) || name === normalizeName(member.name);
};

/**
 * A member as the matching reads them: the two names to compare against, and the provider participant this
 * member's own window reported joining as.
 *
 * That id is self-reported and unverifiable — nothing here or on the server can ask the provider whose uuid
 * that really is — which is why the name still has to agree with it. The check is corroboration, not proof: two
 * people the workspace already shows as indistinguishable can still be confused for each other, and that was
 * accepted rather than overlooked.
 */
type ResolvableMember = Pick<ConferenceMember, 'username' | 'name'> & { providerParticipantId?: string };

const claims = (member: ResolvableMember, participant: PluginParticipant): boolean =>
	!!member.providerParticipantId && member.providerParticipantId === participant.uuid;

/**
 * Which of these members the provider is describing, or none of them.
 *
 * A member who claims the participant's uuid is the answer, provided the name agrees with the claim. A claim
 * the name contradicts is nobody at all rather than an invitation to go looking: falling through to whoever the
 * name happens to fit would turn a stale or wrong id into a confident misattribution.
 *
 * With no claim, a name on its own will do — but only when exactly one member wears it. Two who do is not a
 * weak match, it is a coin toss, and losing it puts someone's microphone under another person's face. A
 * participant nobody claims and no single name fits belongs to no member here, which is the ordinary answer for
 * a SIP dial-in or a guest who opened the provider's own address: they never passed through Rocket.Chat, and
 * no identity of ours will ever cover them.
 */
export const resolveParticipant = <TMember extends ResolvableMember>(
	participant: PluginParticipant,
	candidates: TMember[],
): TMember | undefined => {
	const claimant = candidates.find((member) => claims(member, participant));

	if (claimant) {
		return matchesConferenceMember(participant.displayName, claimant) ? claimant : undefined;
	}

	const named = candidates.filter((member) => matchesConferenceMember(participant.displayName, member));

	return named.length === 1 ? named[0] : undefined;
};

/**
 * Puts the conference's own members and the provider's call participants into the groups the people panel
 * shows, pairing the two with {@link resolveParticipant}.
 *
 * They are different lists and neither contains the other. Ours is the record of who was asked: it carries the
 * avatars, the usernames and the standing — invited, ringing, declined, left — and it holds people who are not
 * in the call at all. The provider's is who is connected to the media right now, which is the only list whose
 * entries can be muted, spotlit or hung up on, and it holds people we have never heard of: guests with a link,
 * dial-ins, anyone who arrived by an address rather than an invitation.
 *
 * So each decides what it is the authority on, and neither is allowed to overrule the other:
 *
 * - **our membership decides which group a member is in.** The rest of the window already counts on it — the
 *   top bar's count, the ring button, who is offered the chat — and a window whose plugin is quiet, or whose
 *   provider never announced a roster, would otherwise show a call with nobody in it.
 * - **the provider decides what a row can do.** A member matched to a participant carries that participant's
 *   controls; one the provider does not have carries none, because there is nothing for a request to name.
 * - **a participant matching nobody is a row of their own**, by the name the provider gave, alongside the
 *   members in the call.
 *
 * The lobby is the one place presence is read from the provider instead, because being let in is the only thing
 * anyone can do about someone waiting there, and a member sitting in a group headed "in the call" would be
 * offered a ring instead of the admit they need.
 *
 * When the two disagree elsewhere, both are simply shown: someone our server still records as present who has
 * gone from the call keeps their row, with nothing to press on it; someone in the call whose join we have not
 * heard about yet is listed as not in it, with the controls that do work.
 */
export const composeCallParticipants = (members: ConferenceMember[], participants: PluginParticipant[]): CallParticipantGroups => {
	// Whoever is still to be spoken for. A member answers for one participant, so settling one of two people
	// sharing a name is also what leaves the other unambiguous.
	const unspokenFor = [...members];
	const participantByMember = new Map<ConferenceMember, PluginParticipant>();

	const settle = (participant: PluginParticipant, member: ConferenceMember) => {
		unspokenFor.splice(unspokenFor.indexOf(member), 1);
		participantByMember.set(member, participant);
	};

	// Claims are read before names, so which of two members sharing a name a claim settles does not depend on the
	// order the provider happened to list the call in. A participant somebody claims is settled here either way,
	// since a claim the name contradicts is not left for the names below to have a second go at.
	const isClaimed = (participant: PluginParticipant) => members.some((member) => claims(member, participant));
	const claimsFirst = [...participants.filter(isClaimed), ...participants.filter((participant) => !isClaimed(participant))];

	for (const participant of claimsFirst) {
		const member = resolveParticipant(participant, unspokenFor);

		if (member) {
			settle(participant, member);
		}
	}

	const spokenFor = new Set(participantByMember.values());
	const external = participants.filter((participant) => !spokenFor.has(participant));

	const groups: CallParticipantGroups = { waiting: [], present: [], absent: [] };

	for (const member of members) {
		const participant = participantByMember.get(member);
		const entry = { key: member._id, member, participant };

		if (participant?.isWaiting) {
			groups.waiting.push(entry);
			continue;
		}

		(isInVideoConference(member) ? groups.present : groups.absent).push(entry);
	}

	for (const participant of external) {
		const entry = { key: `provider:${participant.uuid}`, participant };

		(participant.isWaiting ? groups.waiting : groups.present).push(entry);
	}

	return groups;
};
