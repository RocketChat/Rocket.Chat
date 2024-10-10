import type { IRoom, IRoomWithRetentionPolicy, ISubscription } from '@rocket.chat/core-typings';
import type { IOmnichannelRoom } from '@rocket.chat/omnichannel-typings';

export type SubscriptionWithRoom = ISubscription &
	Pick<
		IRoom,
		| 'description'
		| 'cl'
		| 'topic'
		| 'announcement'
		| 'avatarETag'
		| 'lastMessage'
		| 'uids'
		| 'usernames'
		| 'usersCount'
		| 'muted'
		| 'federated'
		| 'lm'
	> &
	Pick<
		IOmnichannelRoom,
		| 'transcriptRequest'
		| 'servedBy'
		| 'tags'
		| 'onHold'
		| 'closedAt'
		| 'metrics'
		| 'waitingResponse'
		| 'responseBy'
		| 'priorityId'
		| 'priorityWeight'
		| 'slaId'
		| 'estimatedWaitingTimeQueue'
		| 'livechatData'
		| 'departmentId'
		| 'queuedAt'
	> & {
		source?: IOmnichannelRoom['source'];
	} & Pick<Partial<IRoomWithRetentionPolicy>, 'retention'>;
