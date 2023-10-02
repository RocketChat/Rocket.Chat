import { IconButton } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useToastMessageDispatch, useRoute, useMethod, useTranslation } from '@rocket.chat/ui-contexts';
import type { FC } from 'react';
import React from 'react';

import GenericModal from '../../../../client/components/GenericModal';
import { GenericTableCell } from '../../../../client/components/GenericTable';

type RemoveCannedResponseButtonProps = {
	_id: string;
	reload: () => void;
};

const RemoveCannedResponseButton: FC<RemoveCannedResponseButtonProps> = ({ _id, reload }) => {
	const t = useTranslation();
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const cannedResponsesRoute = useRoute('omnichannel-canned-responses');

	const removeCannedResponse = useMethod('removeCannedResponse');

	const handleDelete = useMutableCallback((e) => {
		e.stopPropagation();
		const onDeleteCannedResponse: () => Promise<void> = async () => {
			try {
				await removeCannedResponse(_id);
				reload();
				cannedResponsesRoute.push({});
				dispatchToastMessage({ type: 'success', message: t('Canned_Response_Removed') });
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			} finally {
				setModal(null);
			}
		};

		setModal(
			<GenericModal
				variant='danger'
				onConfirm={onDeleteCannedResponse}
				onCancel={(): void => setModal(null)}
				onClose={(): void => setModal(null)}
				confirmText={t('Delete')}
			></GenericModal>,
		);
	});

	return (
		<GenericTableCell fontScale='p2' color='hint' withTruncatedText>
			<IconButton icon='trash' small title={t('Remove')} onClick={handleDelete} />
		</GenericTableCell>
	);
};

export default RemoveCannedResponseButton;
