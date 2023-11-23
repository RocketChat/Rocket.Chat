import { Modal, Button, Box } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import React from 'react';
import { useTranslation } from 'react-i18next';

type ReachedSeatsCapModalProps = {
	onClose: () => void;
	onContinue: () => void;
	onBuyMoreSeats: () => void;
	showContinue: boolean;
};

const ReachedSeatsCapModal = ({ onClose, onContinue, onBuyMoreSeats, showContinue }: ReachedSeatsCapModalProps): ReactElement => {
	const { t } = useTranslation();

	return (
		<Modal>
			<Modal.Header>
				<Modal.Title>{t('Seat_limit_reached')}</Modal.Title>
				<Modal.Close onClick={onClose} />
			</Modal.Header>
			<Modal.Content>
				<Box is='p' mbe={16}>
					{t('Seat_limit_reached_Description')}
				</Box>
			</Modal.Content>
			<Modal.Footer>
				<Modal.FooterControllers>
					{showContinue && <Button onClick={onContinue}>{t('Continue')}</Button>}
					<Button primary onClick={onBuyMoreSeats}>
						{t('Buy_more_seats')}
					</Button>
				</Modal.FooterControllers>
			</Modal.Footer>
		</Modal>
	);
};

export default ReachedSeatsCapModal;
