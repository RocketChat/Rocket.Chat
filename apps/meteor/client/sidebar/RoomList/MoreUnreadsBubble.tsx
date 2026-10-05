import { css } from '@rocket.chat/css-in-js';
import { Box, Bubble } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

export type MoreUnreadsBubbleProps = {
	direction: 'up' | 'down';
	mention: boolean;
	onClick: () => void;
};

const bubbleWrapperStyle = css`
	position: absolute;
	z-index: 2;
	display: flex;
	inset-inline: 0;
	justify-content: center;
	pointer-events: none;

	> * {
		pointer-events: auto;
	}
`;

const MoreUnreadsBubble = ({ direction, mention = false, onClick }: MoreUnreadsBubbleProps) => {
	const { t } = useTranslation();

	return (
		<Box className={bubbleWrapperStyle} {...(direction === 'up' ? { insetBlockStart: 8 } : { insetBlockEnd: 8 })}>
			<Bubble small icon={direction === 'up' ? 'arrow-up' : 'arrow-down'} onClick={onClick}>
				{mention ? t('Unread_mentions') : t('More_unreads')}
			</Bubble>
		</Box>
	);
};

export default MoreUnreadsBubble;
