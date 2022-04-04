import { Skeleton } from '@rocket.chat/fuselage';
import React, { ReactElement, useMemo, useEffect } from 'react';

import type { IMessage } from '../../../../../definition/IMessage/IMessage';
import type { ReadReceipt } from '../../../../../definition/ReadReceipt';
import GenericModal from '../../../../components/GenericModal';
import { useToastMessageDispatch } from '../../../../contexts/ToastMessagesContext';
import { useTranslation } from '../../../../contexts/TranslationContext';
import { useMethodData } from '../../../../hooks/useMethodData';
import { AsyncStatePhase } from '../../../../lib/asyncState';
import ReadReceiptRow from './ReadReceiptRow';

type ReadReceiptsModalProps = {
	messageId: IMessage['_id'];
	onClose: () => void;
};

const ReadReceiptsModal = ({ messageId, onClose }: ReadReceiptsModalProps): ReactElement => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const { phase, value, error } = useMethodData<Array<ReadReceipt>>(
		'getReadReceipts',
		useMemo(() => [{ messageId }], [messageId]),
	);

	useEffect(() => {
		if (error) {
			dispatchToastMessage({ type: 'error', message: error });
			onClose();
		}
	}, [error, dispatchToastMessage, t, onClose]);

	if (phase === AsyncStatePhase.LOADING || !value || error) {
		return (
			<GenericModal title={t('Read_by')} onConfirm={onClose} onClose={onClose}>
				<Skeleton type='rect' w='full' h='x120' />
			</GenericModal>
		);
	}

	return (
		<GenericModal title={t('Read_by')} onConfirm={onClose} onClose={onClose}>
			{value.length < 1 && t('No_results_found')}
			{value.map((receipt) => (
				<ReadReceiptRow {...receipt} key={receipt._id} />
			))}
		</GenericModal>
	);
};

export default ReadReceiptsModal;
