import { Modal, Button, Box } from '@rocket.chat/fuselage';
import { ExternalLink } from '@rocket.chat/ui-client';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

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
				<Modal.FooterControllers>
					<Button onClick={onClose}>{t('Cancel')}</Button>
					<Button onClick={onConfirm} primary>
						{t('Continue')}
					</Button>
				</Modal.FooterControllers>
			</Modal.Footer>
		</Modal>
	);
};

export default CloseToSeatsCapModal;
