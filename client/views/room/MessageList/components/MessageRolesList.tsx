import { MessageRole, MessageRoles } from '@rocket.chat/fuselage';
import React, { ReactElement } from 'react';

import { useTranslation } from '../../../../contexts/TranslationContext';
import { UserPresence } from '../../../../lib/presence';

type MessageRolesListProps = {
	user: UserPresence;
	isBot?: boolean;
};

const MessageRolesList = ({ user, isBot }: MessageRolesListProps): ReactElement | null => {
	const t = useTranslation();

	return (
		<MessageRoles>
			{user.roles?.map((role, index) => (
				<MessageRole key={index}>{role}</MessageRole>
			))}
			{isBot && <MessageRole>{t('Bot')}</MessageRole>}
		</MessageRoles>
	);
};

export default MessageRolesList;
