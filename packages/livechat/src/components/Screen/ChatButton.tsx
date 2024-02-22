import ChatIcon from '../../icons/chat.svg';
import CloseIcon from '../../icons/close.svg';
import { Button } from '../Button';

type ChatButtonProps = {
	text: string;
	minimized: boolean;
	badge: number;
	onClick: () => void;
	triggered?: boolean;
	className?: string;
	logoUrl?: string;
};

export const ChatButton = ({ text, minimized, badge, onClick, triggered = false, className, logoUrl }: ChatButtonProps) => {
	const openIcon = logoUrl ? <img src={logoUrl} /> : <ChatIcon />;

	return (
		<Button
			icon={minimized || triggered ? openIcon : <CloseIcon />}
			badge={badge}
			onClick={onClick}
			className={className}
			data-qa-id='chat-button'
		>
			{text}
		</Button>
	);
};
