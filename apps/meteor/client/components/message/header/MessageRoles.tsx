import { MessageRole, MessageRoles as FuselageMessageRoles } from '@rocket.chat/fuselage';
import type { MouseEventHandler } from 'react';
import { useTranslation } from 'react-i18next';

export type MessageRolesProps = {
	workspaceRoles: string[];
	roomRoles: string[];
	isBot?: boolean;
	onClick?: MouseEventHandler;
};

const MessageRoles = ({ workspaceRoles, roomRoles, isBot, onClick }: MessageRolesProps) => {
	const { t } = useTranslation();

	const categoryTag = (label: string, roles: string[]) => {
		if (roles.length === 0) {
			return null;
		}

		const extra = roles.length > 1 ? ` (${t('Plus_count_roles', { count: roles.length - 1 })})` : '';

		return (
			<MessageRole title={`${label}: ${roles.join(', ')}`} onClick={onClick}>
				{`${roles[0]}${extra}`}
			</MessageRole>
		);
	};

	return (
		<FuselageMessageRoles>
			{categoryTag(t('Workspace_roles'), workspaceRoles)}
			{categoryTag(t('Room_roles'), roomRoles)}
			{isBot && <MessageRole>{t('Bot')}</MessageRole>}
		</FuselageMessageRoles>
	);
};

export default MessageRoles;
