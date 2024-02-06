import type { IRoom } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { useSetModal, useSetting, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';

import GenericModal from '../../../../components/GenericModal';
import { usePruneMessagesMutation } from './usePruneMessagesMutation';

type PruneMessagesModalProps = {
	toDate: Date;
	fromDate: Date;
	room: IRoom;
};

type PruneActionPayload = {
	users: string[];
	inclusive: boolean;
	pinned: boolean;
	discussion: boolean;
	threads: boolean;
	attached: boolean;
};

const PruneMessagesModal = ({ toDate, fromDate, room }: PruneMessagesModalProps) => {
	const t = useTranslation();
	const setModal = useSetModal();
	const limit = useSetting<number>('Prune_message_limit');
	const pruneMutation = usePruneMessagesMutation();
	const { handleSubmit } = useFormContext<PruneActionPayload>();

	const handlePruneAction = async ({ inclusive, discussion, threads, pinned, attached, users }: PruneActionPayload) => {
		pruneMutation.mutate({
			roomId: room._id,
			latest: toDate.toISOString(),
			oldest: fromDate.toISOString(),
			inclusive,
			limit,
			excludePinned: pinned,
			filesOnly: attached,
			ignoreDiscussion: discussion,
			ignoreThreads: threads,
			users,
		});
	};

	useEffect(() => {
		if (pruneMutation.isSuccess || pruneMutation.isError) {
			setModal(null);
		}
	}, [setModal, pruneMutation.isSuccess, pruneMutation.isError]);

	return (
		<GenericModal
			wrapperFunction={(props) => <Box is='form' onSubmit={handleSubmit(handlePruneAction)} {...props} />}
			variant='danger'
			onCancel={() => setModal(null)}
			confirmText={t('Yes_prune_them')}
			confirmDisabled={pruneMutation.isLoading}
		>
			{t('Prune_Modal')}
		</GenericModal>
	);
};

export default PruneMessagesModal;
