import {
	Box,
	Button,
	Modal,
	ModalClose,
	ModalContent,
	ModalFooter,
	ModalFooterControllers,
	ModalHeader,
	ModalTitle,
} from '@rocket.chat/fuselage';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { PeerAutocomplete, PeerInfo } from '../components';
import { usePeerAutocomplete, type PeerInfo as PeerInfoType } from '../context';

type TransferModalProps = {
	onCancel(): void;
	onConfirm(kind: 'user' | 'sip', peer: { displayName: string; id: string }): void;
};

const TransferModal = ({ onCancel, onConfirm }: TransferModalProps) => {
	const { t } = useTranslation();

	const modalId = useId();

	const [peer, setPeer] = useState<PeerInfoType | undefined>(undefined);
	const [error, setError] = useState<string | undefined>(undefined);

	const autocomplete = usePeerAutocomplete(setPeer, peer);

	const onChangeValue = (value: string | string[]) => {
		if (error) {
			setError(undefined);
		}
		autocomplete.onChangeValue(value);
	};

	const confirm = () => {
		if (!peer) {
			setError(t('Field_required'));
			return;
		}

		setError(undefined);

		if ('userId' in peer) {
			onConfirm('user', { id: peer.userId, displayName: peer.displayName });
			return;
		}

		if ('number' in peer) {
			onConfirm('sip', { id: peer.number, displayName: peer.number });
			return;
		}

		throw new Error('Peer info is missing userId and/or number');
	};

	return (
		<Modal open aria-labelledby={modalId}>
			<ModalHeader>
				<ModalTitle id={modalId}>{t('Transfer_call')}</ModalTitle>
				<ModalClose aria-label={t('Close')} onClick={onCancel} />
			</ModalHeader>
			<ModalContent>
				<PeerAutocomplete {...autocomplete} error={error} onChangeValue={onChangeValue} />
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
					<Button danger onClick={confirm} icon='phone-off'>
						{t('Hang_up_and_transfer_call')}
					</Button>
				</ModalFooterControllers>
			</ModalFooter>
		</Modal>
	);
};

export default TransferModal;
