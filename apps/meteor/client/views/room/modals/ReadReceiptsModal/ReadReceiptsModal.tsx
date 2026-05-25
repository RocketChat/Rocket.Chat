import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import { GenericModal, GenericModalSkeleton } from '@rocket.chat/ui-client';
import { useEndpoint, useStream, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import ReadReceiptRow from './ReadReceiptRow';
import { mapReadReceiptFromApi } from '../../../../lib/utils/mapReadReceiptFromApi';

type ReadReceiptsModalProps = {
	messageId: IMessage['_id'];
	rid?: IRoom['_id'];
	onClose: () => void;
};

const ReadReceiptsModal = ({ messageId, rid, onClose }: ReadReceiptsModalProps): ReactElement => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const queryClient = useQueryClient();
	const subscribeToNotifyRoom = useStream('notify-room');

	const getReadReceipts = useEndpoint('GET', '/v1/chat.getMessageReadReceipts');

	const queryKey = ['read-receipts', messageId];

	const readReceiptsResult = useQuery({
		queryKey,
		queryFn: async () => (await getReadReceipts({ messageId })).receipts.map(mapReadReceiptFromApi),
	});

	useEffect(() => {
		if (!rid) {
			return;
		}
		return subscribeToNotifyRoom(`${rid}/messagesRead`, () => {
			queryClient.invalidateQueries({ queryKey });
		});
	}, [rid, queryClient, queryKey, subscribeToNotifyRoom]);

	useEffect(() => {
		if (readReceiptsResult.isError) {
			dispatchToastMessage({ type: 'error', message: readReceiptsResult.error });
			onClose();
		}
	}, [dispatchToastMessage, t, onClose, readReceiptsResult.isError, readReceiptsResult.error]);

	if (readReceiptsResult.isLoading || readReceiptsResult.isError) {
		return <GenericModalSkeleton />;
	}

	const readReceipts = readReceiptsResult?.data;

	return (
		<GenericModal title={t('Read_by')} onConfirm={onClose} onClose={onClose}>
			{readReceipts && readReceipts.length < 1 && t('No_results_found')}
			{readReceipts && readReceipts.length > 0 && (
				<div role='list'>
					{readReceipts.map((receipt) => (
						<ReadReceiptRow key={receipt._id} {...receipt} />
					))}
				</div>
			)}
		</GenericModal>
	);
};

export default ReadReceiptsModal;
