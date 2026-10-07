import {
	Box,
	Button,
	Field,
	FieldLabel,
	FieldRow,
	Modal,
	ModalClose,
	ModalContent,
	ModalFooter,
	ModalFooterControllers,
	ModalHeader,
	ModalTitle,
	ToggleSwitch,
} from '@rocket.chat/fuselage';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { PeerAutocomplete, PeerInfo } from '../components';
import { usePeerAutocomplete, type PeerInfo as PeerInfoType } from '../context';
import { isExternalPeer } from '../utils/isExternalPeer';
import { isInternalPeer } from '../utils/isInternalPeer';
import { isUnknownPeer } from '../utils/isUnknownPeer';

export type TransferModalProps = {
	onCancel(): void;
	onConfirm(kind: 'user' | 'sip', peer: { displayName: string; id: string }): void;
	/** Omitted when the call can't be put on hold, which hides the consultation button */
	onConsult?(kind: 'user' | 'sip', peer: { displayName: string; id: string }): void;
};

const TransferModal = ({ onCancel, onConfirm, onConsult }: TransferModalProps) => {
	const { t } = useTranslation();

	const modalId = useId();

	const [peer, setPeer] = useState<PeerInfoType | undefined>(undefined);
	const [error, setError] = useState<string | undefined>(undefined);
	const [askFirst, setAskFirst] = useState(false);
	const askFirstId = useId();

	const autocomplete = usePeerAutocomplete(setPeer, peer);

	const onChangeValue = (value: string | string[]) => {
		if (error) {
			setError(undefined);
		}
		autocomplete.onChangeValue(value);
	};

	const submitWith = (callback: TransferModalProps['onConfirm']) => () => {
		if (!peer) {
			setError(t('Field_required'));
			return;
		}

		setError(undefined);

		if (isInternalPeer(peer)) {
			callback('user', { id: peer.userId, displayName: peer.displayName });
			return;
		}

		if (isExternalPeer(peer)) {
			callback('sip', { id: peer.number, displayName: peer.number });
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
				{peer && !isUnknownPeer(peer) && (
					<Box marginBlock={8}>
						<PeerInfo {...peer} />
					</Box>
				)}
				{onConsult && (
					<Field marginBlockStart={16}>
						<FieldRow>
							<FieldLabel htmlFor={askFirstId}>{t('Ask_first')}</FieldLabel>
							<ToggleSwitch id={askFirstId} checked={askFirst} onChange={() => setAskFirst((value) => !value)} />
						</FieldRow>
					</Field>
				)}
			</ModalContent>
			<ModalFooter>
				<ModalFooterControllers>
					<Button secondary onClick={onCancel}>
						{t('Cancel')}
					</Button>
					{onConsult && askFirst ? (
						<Button primary onClick={submitWith(onConsult)} icon='pause-shape-unfilled'>
							{t('Hold_and_consult_before_transferring')}
						</Button>
					) : (
						<Button danger onClick={submitWith(onConfirm)} icon='phone-off'>
							{t('Hang_up_and_transfer_call')}
						</Button>
					)}
				</ModalFooterControllers>
			</ModalFooter>
		</Modal>
	);
};

export default TransferModal;
