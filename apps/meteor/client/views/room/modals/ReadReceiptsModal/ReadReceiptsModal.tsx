import { IMessage, ReadReceipt } from '@rocket.chat/core-typings';
import { Skeleton } from '@rocket.chat/fuselage';
import { useMethod, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import React, { ReactElement, useEffect } from 'react';

import GenericModal from '../../../../components/GenericModal';
import ReadReceiptRow from './ReadReceiptRow';

type ReadReceiptsModalProps = {
	messageId: IMessage['_id'];
	onClose: () => void;
};

const ReadReceiptsModal = ({ messageId, onClose }: ReadReceiptsModalProps): ReactElement => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const getReadReceipts = useMethod('getReadReceipts');

	const readReceiptsResult = useQuery<ReadReceipt[], Error>(['read-receipts', messageId], () => getReadReceipts({ messageId }));

	useEffect(() => {
		if (readReceiptsResult.isError) {
			dispatchToastMessage({ type: 'error', message: readReceiptsResult.error });
			onClose();
		}
	}, [dispatchToastMessage, t, onClose, readReceiptsResult.isError, readReceiptsResult.error]);

	if (readReceiptsResult.isLoading || readReceiptsResult.isError) {
		return (
			<GenericModal title={t('Read_by')} onConfirm={onClose} onClose={onClose}>
				<Skeleton type='rect' w='full' h='x120' />
			</GenericModal>
		);
	}

	const readReceipts = readReceiptsResult.data;

	return (
		<GenericModal title={t('Read_by')} onConfirm={onClose} onClose={onClose}>
			{readReceipts.length < 1 && t('No_results_found')}
			{readReceipts.map((receipt) => (
				<ReadReceiptRow {...receipt} key={receipt._id} />
			))}
		</GenericModal>
	);
};

export default ReadReceiptsModal;
