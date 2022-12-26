import { MessageRole, MessageRoles } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

type RoomMessageRolesProps = {
	roles: Array<string>;
	isBot?: boolean;
};

const RoomMessageRoles = ({ roles, isBot }: RoomMessageRolesProps): ReactElement | null => {
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

export default RoomMessageRoles;
