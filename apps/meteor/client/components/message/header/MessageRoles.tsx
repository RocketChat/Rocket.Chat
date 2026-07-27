import { MessageRole, MessageRoles as FuselageMessageRoles } from '@rocket.chat/fuselage';
import type { MouseEventHandler } from 'react';
import { useTranslation } from 'react-i18next';

export type MessageRolesProps = {
	roles: Array<string>;
	isBot?: boolean;
	onClick?: MouseEventHandler;
};

const MessageRoles = ({ roles, isBot, onClick }: MessageRolesProps) => {
	const { t } = useTranslation();

	const allRoles = isBot ? [...roles, t('Bot')] : roles;
	const collapsed = allRoles.length > 2;
	const visibleRoles = collapsed ? allRoles.slice(0, 1) : allRoles;
	const hiddenRoles = collapsed ? allRoles.slice(1) : [];

	return (
		<FuselageMessageRoles onClick={onClick} style={onClick ? { cursor: 'pointer' } : undefined}>
			{visibleRoles.map((role, index) => (
				<MessageRole key={index}>{role}</MessageRole>
			))}
			{hiddenRoles.length > 0 && (
				<MessageRole title={hiddenRoles.join(', ')}>{t('Plus_count_roles', { count: hiddenRoles.length })}</MessageRole>
			)}
		</FuselageMessageRoles>
	);
};

export default MessageRoles;
