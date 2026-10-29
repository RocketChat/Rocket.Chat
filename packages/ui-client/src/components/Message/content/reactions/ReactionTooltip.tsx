import type { IMessage } from '@rocket.chat/core-typings';
import { Skeleton } from '@rocket.chat/fuselage';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useContext } from 'react';
import { useTranslation } from 'react-i18next';

import { MarkdownTextContext } from '../../../MarkdownTextContext';
import { useMessageRelatedData } from '../../contexts/MessageRelatedDataContext';

export type ReactionTooltipProps = {
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

const getRealNames = (message: IMessage | undefined, emojiName: string, usernames: string[], username: string | undefined) => {
	const reaction = message?.reactions?.[emojiName];

	if (!message?.reactions) {
		return [];
	}

	if (!reaction?.names) {
		return usernames;
	}

	if (!username) {
		return reaction.names;
	}

	const ownIndex = reaction.usernames.indexOf(username);
	return reaction.names.filter((name, index) => index !== ownIndex && Boolean(name));
};

const ReactionTooltip = ({ emojiName, usernames, mine, messageId, showRealName, username }: ReactionTooltipProps) => {
	const { t } = useTranslation();
	const MarkdownText = useContext(MarkdownTextContext);

	const key = getTranslationKey(usernames, mine);

	const needsRealNames = showRealName && usernames.length > 0;
	const { data: message, isLoading } = useMessageRelatedData().useMessageById(messageId, { enabled: needsRealNames });

	if (needsRealNames && isLoading) {
		return (
			<>
				<Skeleton width='x200' variant='text' inverted />
				<Skeleton width='x200' variant='text' inverted />
				{usernames.length > 5 && <Skeleton width='x200' variant='text' inverted />}
				{usernames.length > 8 && <Skeleton width='x200' variant='text' inverted />}
			</>
		);
	}

	const users = needsRealNames ? getRealNames(message, emojiName, usernames, username) : usernames;

	return (
		<MarkdownText
			content={t(key, {
				counter: usernames.length > 10 ? usernames.length - 10 : usernames.length,
				users: users.slice(0, 10).join(', '),
				emoji: emojiName,
			})}
			variant='inline'
		/>
	);
};

export default ReactionTooltip;
