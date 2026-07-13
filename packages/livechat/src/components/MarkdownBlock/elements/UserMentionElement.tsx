import { MessageHighlight } from '@rocket.chat/fuselage';
import { memo } from 'preact/compat';
import { useTranslation } from 'react-i18next';

export type UserMentionElementProps = {
	mention: string;
};

const UserMentionElement = ({ mention }: UserMentionElementProps) => {
	const { t } = useTranslation();

	if (mention === 'all') {
		return (
			<MessageHighlight title={t('Mentions_all_room_members')} variant='relevant'>
				@all
			</MessageHighlight>
		);
	}

	if (mention === 'here') {
		return (
			<MessageHighlight title={t('Mentions_online_room_members')} variant='relevant'>
				@here
			</MessageHighlight>
		);
	}

	return <>@{mention}</>;
};

export default memo(UserMentionElement);
