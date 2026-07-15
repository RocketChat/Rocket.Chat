import type { IGroupVideoConference } from '@rocket.chat/core-typings';
import { VideoConferenceStatus } from '@rocket.chat/core-typings';

const creator: IGroupVideoConference['createdBy'] = {
	_id: 'user-creator',
	username: 'rocket.cat',
	name: 'Rocket Cat',
};

const makeParticipants = (count: number): IGroupVideoConference['users'] =>
	Array.from({ length: count }, (_, i) => ({
		_id: `user-${i}`,
		username: `participant.${i + 1}`,
		name: `Participant ${i + 1}`,
		avatarETag: null,
		ts: new Date('2024-06-17T10:00:00Z'),
	}));

const baseCall = (overrides: Partial<IGroupVideoConference> = {}): IGroupVideoConference =>
	({
		_id: 'call-1',
		_updatedAt: new Date('2024-06-17T10:00:00Z'),
		type: 'videoconference' as const,
		rid: 'GENERAL',
		providerName: 'Pexip',
		status: VideoConferenceStatus.STARTED,
		messages: {},
		title: 'Conference Room',
		anonymousUsers: 0,
		users: [{ ...creator, avatarETag: null, ts: new Date('2024-06-17T10:00:00Z') }],
		createdBy: creator,
		createdAt: new Date('2024-06-17T10:00:00Z'),
		...overrides,
	}) as IGroupVideoConference;

export const ongoingCall = baseCall({ _id: 'call-ongoing-1' });
export const ongoingCallWithDiscussion = baseCall({ _id: 'call-ongoing-2', discussionRid: 'discussion-room-1' });
export const ongoingCallWithParticipants = baseCall({
	_id: 'call-ongoing-3',
	users: [{ ...creator, avatarETag: null, ts: new Date() }, ...makeParticipants(3)],
});
export const ongoingCallMaxParticipants = baseCall({
	_id: 'call-ongoing-4',
	users: [{ ...creator, avatarETag: null, ts: new Date() }, ...makeParticipants(8)],
});

export const pastCallWithDiscussion = baseCall({
	_id: 'call-past-1',
	status: VideoConferenceStatus.ENDED,
	endedAt: new Date('2024-06-17T11:00:00Z'),
	discussionRid: 'discussion-room-2',
});
export const pastCallNoDiscussion = baseCall({
	_id: 'call-past-2',
	status: VideoConferenceStatus.ENDED,
	endedAt: new Date('2024-06-17T09:00:00Z'),
});
