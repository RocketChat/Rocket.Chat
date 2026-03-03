import { Button } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

type ActionToggleChatProps = {
	pressed: boolean;
	onClick: () => void;
};
const ActionToggleChat = ({ pressed, onClick }: ActionToggleChatProps) => {
	const { t } = useTranslation();
	const icon = pressed ? 'chevron-down' : 'chevron-up';

	const label = pressed ? t('Hide_chat') : t('Show_chat');
	return (
		<Button medium onClick={onClick} icon={icon}>
			{label}
		</Button>
	);
};

export default ActionToggleChat;
