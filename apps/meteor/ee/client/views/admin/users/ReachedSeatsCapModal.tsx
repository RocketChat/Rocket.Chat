import { Icon, Modal, ButtonGroup, Button, Box } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

import ExternalLink from '../../../../../client/components/ExternalLink';
import SeatsCapUsage from './SeatsCapUsage';

type ReachedSeatsCapModalProps = {
	members: number;
	limit: number;
	requestSeatsLink: string;
	onClose: () => void;
};

const ReachedSeatsCapModal = ({ members, limit, onClose, requestSeatsLink }: ReachedSeatsCapModalProps): ReactElement => {
	const t = useTranslation();
	return (
		<Modal>
			<Modal.Header>
				<Modal.Title>{t('Request_more_seats_title')}</Modal.Title>
				<Modal.Close onClick={onClose} />
			</Modal.Header>
			<Modal.Content>
				<Box is='p' mbe='x16'>
					{t('Request_more_seats_out_of_seats')}
				</Box>
				<Box is='p' mbe='x24'>
					{t('Request_more_seats_sales_team')}
				</Box>
				<SeatsCapUsage members={members} limit={limit} />
			</Modal.Content>
			<Modal.Footer>
				<ButtonGroup align='end'>
					<Button onClick={onClose}>{t('Cancel')}</Button>
					<ExternalLink to={requestSeatsLink}>
						<Button onClick={onClose} primary>
							<Icon name='new-window' size='x20' mie='x4' />
							{t('Request')}
						</Button>
					</ExternalLink>
				</ButtonGroup>
			</Modal.Footer>
		</Modal>
	);
};

export default ReachedSeatsCapModal;
