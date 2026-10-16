import type { SystemLabelKey } from '@rocket.chat/core-typings';
import { isRoomFederated } from '@rocket.chat/core-typings';
import type { RocketchatI18nKeys } from '@rocket.chat/i18n';
import type { Keys as IconName } from '@rocket.chat/icons';
import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';

import { isUnreadRoom } from '../../../hooks/useRoomList';

type SystemLabel = {
	i18n: RocketchatI18nKeys;
	icon: IconName;
	match: (subscription: SubscriptionWithRoom) => boolean;
};

export const SYSTEM_LABELS = {
	unread: { i18n: 'Unread', icon: 'flag', match: isUnreadRoom },
	mentions: { i18n: 'Mentions', icon: 'at', match: (sub) => sub.userMentions > 0 || sub.groupMentions > 0 },
	threads: { i18n: 'Threads', icon: 'thread', match: (sub) => Boolean(sub.tunread?.length) },
	direct: { i18n: 'Direct_Messages', icon: 'balloon', match: (sub) => sub.t === 'd' },
	public: { i18n: 'Public', icon: 'hashtag', match: (sub) => sub.t === 'c' },
	private: { i18n: 'Private', icon: 'hashtag-lock', match: (sub) => sub.t === 'p' },
	teams: { i18n: 'Teams', icon: 'team', match: (sub) => Boolean(sub.teamMain) },
	favorites: { i18n: 'Favorites', icon: 'star', match: (sub) => Boolean(sub.f) },
	discussions: { i18n: 'Discussions', icon: 'discussion', match: (sub) => Boolean(sub.prid) },
	federated: { i18n: 'Federated', icon: 'globe', match: (sub) => isRoomFederated(sub) },
	hidden: { i18n: 'Hidden', icon: 'eye-off', match: (sub) => sub.open === false },
	archived: { i18n: 'Archived', icon: 'archive', match: (sub) => Boolean(sub.archived) },
} as const satisfies Record<SystemLabelKey, SystemLabel>;
