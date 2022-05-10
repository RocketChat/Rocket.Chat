import { MessageRole, MessageRoles } from '@rocket.chat/fuselage';
import React, { ReactElement } from 'react';

import { useTranslation } from '../../../../contexts/TranslationContext';

type MessageRolesListProps = {
	roles: Array<string>;
	isBot?: boolean;
};

const MessageRolesList = ({ roles, isBot }: MessageRolesListProps): ReactElement | null => {
	const t = useTranslation();

	return (
		<MessageRoles>
			{roles.map((role, index) => (
				<MessageRole key={index}>{role}</MessageRole>
			))}
			{isBot && <MessageRole>{t('Bot')}</MessageRole>}
		</MessageRoles>
	);
};

export default MessageRolesList;
