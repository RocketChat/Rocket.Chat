import { isInVideoConference } from '@rocket.chat/core-typings';

import type { PluginFeature, PluginParticipant, PluginSelf } from './providerPlugin';
import type { ConferenceMember } from '../context/definitions';

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
 * What each control needs before it is worth offering.
 *
 * `flag` is the subject's own permission and `hostOnly` the viewer's — separate questions, because `can.*`
 * describes the participant rather than anyone's authority over them.
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
 * Nothing answers a request, so a control offered where any of the three requirements fails is a button that
 * silently does nothing, every time it is pressed.
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
 * member's own window reported joining as — self-reported and unverifiable, which is why the name still has to
 * agree with it.
 */
type ResolvableMember = Pick<ConferenceMember, 'username' | 'name'> & { providerParticipantId?: string };

const claims = (member: ResolvableMember, participant: PluginParticipant): boolean =>
	!!member.providerParticipantId && member.providerParticipantId === participant.uuid;

/**
 * Which of these members the provider is describing, or none of them.
 *
 * A claim the name contradicts is nobody rather than an invitation to go looking, and a name two members wear
 * is a coin toss rather than a weak match — losing either puts someone's microphone under another person's
 * face.
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
 * Puts the conference's own members and the provider's call participants into the groups the people panel shows,
 * pairing the two with {@link resolveParticipant}.
 *
 * Neither list overrules the other: ours decides which group a member is in, the provider's decides what a row
 * can do, and anyone waiting in the lobby is lifted ahead of both.
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
