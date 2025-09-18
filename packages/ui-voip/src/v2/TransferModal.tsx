import {
	Box,
	Button,
	Modal,
	ModalClose,
	ModalContent,
	ModalFooter,
	ModalFooterControllers,
	ModalHeader,
	ModalIcon,
	ModalTitle,
} from '@rocket.chat/fuselage';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { usePeerAutocomplete } from './MediaCallContext';
import type { PeerInfo as PeerInfoType } from './MediaCallContext';
import { PeerAutocomplete, PeerInfo } from './components';

type TransferModalProps = {
	isLoading?: boolean;
	onCancel(): void;
	onConfirm(kind: 'user' | 'sip', id: string): void;
};

const TransferModal = ({ onCancel, onConfirm }: TransferModalProps) => {
	const { t } = useTranslation();

	const modalId = useId();

	const [peer, setPeer] = useState<PeerInfoType | undefined>(undefined);

	const autocomplete = usePeerAutocomplete(setPeer, peer);

	const confirm = () => {
		if (!peer) {
			return;
		}

		if ('userId' in peer) {
			onConfirm('user', peer.userId);
			return;
		}

		if ('number' in peer) {
			onConfirm('sip', peer.number);
			return;
		}

		throw new Error('Peer info is missing userId and/or number');
	};

	return (
		<Modal open aria-labelledby={modalId}>
			<ModalHeader>
				<ModalIcon color='danger' name='modal-warning' />
				<ModalTitle id={modalId}>{t('Transfer_call')}</ModalTitle>
				<ModalClose aria-label={t('Close')} onClick={onCancel} />
			</ModalHeader>
			<ModalContent>
				<PeerAutocomplete {...autocomplete} />
				{peer && (
					<Box mb={8}>
						<PeerInfo {...peer} />
					</Box>
				)}
			</ModalContent>
			<ModalFooter>
				<ModalFooterControllers>
					<Button secondary onClick={onCancel}>
						{t('Cancel')}
					</Button>
					<Button danger onClick={confirm} disabled={!peer}>
						{t('Hang_up_and_transfer_call')}
					</Button>
				</ModalFooterControllers>
			</ModalFooter>
		</Modal>
	);
};

export default TransferModal;
