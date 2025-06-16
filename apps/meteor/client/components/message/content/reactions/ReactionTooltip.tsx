import { Skeleton } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { useGetMessageByID } from '../../../../views/room/contextualBar/Threads/hooks/useGetMessageByID';
import MarkdownText from '../../../MarkdownText';

type ReactionTooltipProps = {
	emojiName: string;
	usernames: string[];
	username: string | undefined;
	mine: boolean;
	showRealName: boolean;
	messageId: string;
};

const getTranslationKey = (users: string[], mine: boolean): TranslationKey => {
	if (users.length === 0) {
		if (mine) {
			return 'You_reacted_with';
		}
	}

	if (users.length > 10) {
		if (mine) {
			return 'You_users_and_more_Reacted_with';
		}
		return 'Users_and_more_reacted_with';
	}

	if (mine) {
		return 'You_and_users_Reacted_with';
	}
	return 'Users_reacted_with';
};

const ReactionTooltip = ({ emojiName, usernames, mine, messageId, showRealName, username }: ReactionTooltipProps) => {
	const { t } = useTranslation();

	const key = getTranslationKey(usernames, mine);

	const getMessage = useGetMessageByID();

	const { data: users, isLoading } = useQuery({
		queryKey: ['chat.getMessage', 'reactions', messageId, usernames],

		queryFn: async () => {
			// This happens if the only reaction is from the current user
			if (!usernames.length) {
				return [];
			}

			if (!showRealName) {
				return usernames;
			}

			const data = await getMessage(messageId);

			const { reactions } = data;

			if (!reactions) {
				return [];
			}

			if (username) {
				const index = reactions[emojiName].usernames.indexOf(username);
				index >= 0 && reactions[emojiName].names?.splice(index, 1);
				return (reactions[emojiName].names || usernames).filter(Boolean);
			}

			return reactions[emojiName].names || usernames;
		},

		staleTime: 1000 * 60 * 5,
	});

	if (isLoading) {
		return (
			<>
				<Skeleton width='x200' variant='text' backgroundColor='surface-light' />
				<Skeleton width='x200' variant='text' backgroundColor='surface-light' />
				{usernames.length > 5 && <Skeleton width='x200' variant='text' backgroundColor='surface-light' />}
				{usernames.length > 8 && <Skeleton width='x200' variant='text' backgroundColor='surface-light' />}
			</>
		);
	}

	return (
		<MarkdownText
			content={t(key, {
				counter: usernames.length > 10 ? usernames.length - 10 : usernames.length,
				users: users?.slice(0, 10).join(', ') || '',
				emoji: emojiName,
			})}
			variant='inline'
		/>
	);
};

export default ReactionTooltip;
