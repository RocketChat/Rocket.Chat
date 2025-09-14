import { css } from '@rocket.chat/css-in-js';
import { Box, Button, States, StatesActions, StatesIcon, StatesSubtitle, StatesTitle } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

const containerStyle = css`
	display: flex;
	align-items: center;
	justify-content: center;
	padding-block-end: 10%;
	width: 100%;
	height: 100%;
`;

type OutboundMessageCloseConfirmationProps = {
	onConfirm(): void;
	onCancel(): void;
};

const OutboundMessageCloseConfirmation = ({ onConfirm, onCancel }: OutboundMessageCloseConfirmationProps) => {
	const { t } = useTranslation();
	return (
		<Box bg='surface-light' className={containerStyle} aria-live='assertive'>
			<States>
				<StatesIcon name='warning' variation='danger' />
				<StatesTitle>{t('All_changes_will_be_lost')}</StatesTitle>
				<StatesSubtitle>{t('Are_you_sure_you_want_to_discard_this_outbound_message')}</StatesSubtitle>
				<StatesActions>
					<Button ref={(el) => el?.focus()} secondary onClick={onCancel}>
						{t('Cancel')}
					</Button>
					<Button danger onClick={onConfirm}>
						{t('Confirm')}
					</Button>
				</StatesActions>
			</States>
		</Box>
	);
};

export default OutboundMessageCloseConfirmation;
