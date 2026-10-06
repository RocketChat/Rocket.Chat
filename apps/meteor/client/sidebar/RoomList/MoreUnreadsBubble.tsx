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

	const getAccessibleName = () => {
		if (mention) {
			return direction === 'up' ? t('Unread_mentions_above') : t('Unread_mentions_below');
		}

		return direction === 'up' ? t('More_unreads_above') : t('More_unreads_below');
	};

	return (
		<Box className={bubbleWrapperStyle} {...(direction === 'up' ? { insetBlockStart: 8 } : { insetBlockEnd: 8 })}>
			<Bubble
				small
				icon={direction === 'up' ? 'arrow-up' : 'arrow-down'}
				onClick={onClick}
				contentProps={{ 'aria-label': getAccessibleName() }}
			>
				{mention ? t('Unread_mentions') : t('More_unreads')}
			</Bubble>
		</Box>
	);
};

export default MoreUnreadsBubble;
