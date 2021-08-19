import { Icon, Modal, ButtonGroup, Button, Box } from '@rocket.chat/fuselage';
import React, { ReactElement, ComponentProps } from 'react';

import { useTranslation } from '../../../contexts/TranslationContext';
import MemberCapUsage from './MemberCapUsage';

type CloseToLimitModalProps = {
	members: number;
	limit: number;
	title: string;
	confirmText: string;
	confirmIcon: ComponentProps<typeof Icon>['name'];
	requestSeatsLink: string;
	onConfirm: () => void;
	onClose: () => void;
};

const CloseToLimitModal = ({
	members,
	limit,
	onClose,
	requestSeatsLink,
}: CloseToLimitModalProps): ReactElement => {
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
				<MemberCapUsage members={members} limit={limit} />
			</Modal.Content>
			<Modal.Footer>
				<ButtonGroup align='end'>
					<Button onClick={onClose}>{t('Cancel')}</Button>
					<Button is='a' href={requestSeatsLink} onClick={onClose} primary>
						<Icon name='new-window' size='x20' mie='x4' />
						{t('Request')}
					</Button>
				</ButtonGroup>
			</Modal.Footer>
		</Modal>
	);
};

export default CloseToLimitModal;
