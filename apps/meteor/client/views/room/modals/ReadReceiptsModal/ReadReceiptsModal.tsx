import type { IMessage, ReadReceipt } from '@rocket.chat/core-typings';
import { useMethod, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import React, { useEffect } from 'react';

import GenericModal from '../../../../components/GenericModal';
import GenericModalSkeleton from '../../../../components/GenericModal/GenericModalSkeleton';
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
		return <GenericModalSkeleton />;
	}

	const readReceipts = readReceiptsResult.data;

	return (
		<GenericModal title={t('Read_by')} onConfirm={onClose} onClose={onClose}>
			{readReceipts.length < 1 && t('No_results_found')}
			{readReceipts.length > 0 && (
				<div role='list'>
					{readReceipts.map((receipt) => (
						<ReadReceiptRow {...receipt} key={receipt._id} />
					))}
				</div>
			)}
		</GenericModal>
	);
};

export default ReadReceiptsModal;
