import { Badge, Button } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

export type ActionToggleChatProps = {
	pressed: boolean;
	onClick: () => void;
	unreadCount?: number;
};
const ActionToggleChat = ({ pressed, onClick, unreadCount = 0 }: ActionToggleChatProps) => {
	const { t } = useTranslation();

	const displayCount = unreadCount > 99 ? '99+' : unreadCount;

	return (
		<Button medium primary={pressed} onClick={onClick} icon='chat'>
			{t('Chat')}
			{unreadCount > 0 && (
				<Badge small variant='danger' style={{ marginInlineStart: 4 }}>
					{displayCount}
				</Badge>
			)}
		</Button>
	);
};

export default ActionToggleChat;
