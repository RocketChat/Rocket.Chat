import { MessageRole, MessageRoles } from '@rocket.chat/fuselage';
import React, { ReactElement } from 'react';

import { useTranslation } from '../../../../contexts/TranslationContext';
import { UserPresence } from '../../../../lib/presence';
import { useMessageListShowRoles } from '../contexts/MessageListContext';

type MessageRolesListProps = {
	user: UserPresence;
	isBot?: boolean;
};

const MessageRolesList = ({ user, isBot }: MessageRolesListProps): ReactElement | null => {
	const t = useTranslation();
	const showRoles = useMessageListShowRoles();

	if (!showRoles || !user.roles || !Array.isArray(user.roles) || user.roles.length < 1) {
		return null;
	}

	return (
		<MessageRoles>
			{user.roles.map((role, index) => (
				<MessageRole key={index}>{role}</MessageRole>
			))}
			{isBot && <MessageRole>{t('Bot')}</MessageRole>}
		</MessageRoles>
	);
};

export default MessageRolesList;
