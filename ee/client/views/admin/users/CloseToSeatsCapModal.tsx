import { Modal, ButtonGroup, Button, Box } from '@rocket.chat/fuselage';
import React, { ReactElement } from 'react';

import ExternalLink from '../../../../../client/components/ExternalLink';
import { useTranslation } from '../../../../../client/contexts/TranslationContext';
import MemberCapUsage from './SeatsCapUsage';

type CloseToSeatsCapModalProps = {
	members: number;
	limit: number;
	title: string;
	requestSeatsLink: string;
	onConfirm: () => void;
	onClose: () => void;
};

const CloseToSeatsCapModal = ({ members, limit, title, onConfirm, onClose, requestSeatsLink }: CloseToSeatsCapModalProps): ReactElement => {
	const t = useTranslation();
	return (
		<Modal>
			<Modal.Header>
				<Modal.Title>{title}</Modal.Title>
				<Modal.Close onClick={onClose} />
			</Modal.Header>
			<Modal.Content>
				<Box is='p' mbe='x24'>
					{t('Close_to_seat_limit_warning')} <ExternalLink to={requestSeatsLink}>{t('Request_more_seats')}</ExternalLink>
				</Box>
				<MemberCapUsage members={members} limit={limit} />
			</Modal.Content>
			<Modal.Footer>
				<ButtonGroup align='end'>
					<Button onClick={onClose}>{t('Cancel')}</Button>
					<Button onClick={onConfirm} primary>
						{t('Continue')}
					</Button>
				</ButtonGroup>
			</Modal.Footer>
		</Modal>
	);
};

export default CloseToSeatsCapModal;
