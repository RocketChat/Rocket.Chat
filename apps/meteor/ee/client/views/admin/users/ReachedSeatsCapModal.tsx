import { Modal, Button, Box } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import { useExternalLink } from '../../../../../client/hooks/useExternalLink';
import SeatsCapUsage from './SeatsCapUsage';

type ReachedSeatsCapModalProps = {
	members: number;
	limit: number;
	requestSeatsLink: string;
	onClose: () => void;
};

const ReachedSeatsCapModal = ({ members, limit, onClose, requestSeatsLink }: ReachedSeatsCapModalProps): ReactElement => {
	const t = useTranslation();
	const handleExternalLink = useExternalLink();

	return (
		<Modal>
			<Modal.Header>
				<Modal.Title>{t('Request_more_seats_title')}</Modal.Title>
				<Modal.Close onClick={onClose} />
			</Modal.Header>
			<Modal.Content>
				<Box is='p' mbe={16}>
					{t('Request_more_seats_out_of_seats')}
				</Box>
				<Box is='p' mbe={24}>
					{t('Request_more_seats_sales_team')}
				</Box>
				<SeatsCapUsage members={members} limit={limit} />
			</Modal.Content>
			<Modal.Footer>
				<Modal.FooterControllers>
					<Button onClick={onClose}>{t('Cancel')}</Button>
					<Button
						icon='new-window'
						onClick={() => {
							handleExternalLink(requestSeatsLink);
							onClose();
						}}
						primary
					>
						{t('Request')}
					</Button>
				</Modal.FooterControllers>
			</Modal.Footer>
		</Modal>
	);
};

export default ReachedSeatsCapModal;
