import type { IRoom } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { GenericModal } from '@rocket.chat/ui-client';
import { useEndpoint, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Trans, useTranslation } from 'react-i18next';

import { ABACQueryKeys } from '../../../../lib/queryKeys';

type DeleteRoomModalProps = {
	rid: IRoom['_id'];
	roomName: string;
	onClose: () => void;
};

const DeleteRoomModal = ({ rid, roomName, onClose }: DeleteRoomModalProps) => {
	const { t } = useTranslation();

	const queryClient = useQueryClient();
	const dispatchToastMessage = useToastMessageDispatch();
	const deleteRoomAttributes = useEndpoint('DELETE', '/v1/abac/rooms/:rid/attributes', { rid });

	const deleteMutation = useMutation({
		mutationFn: () => deleteRoomAttributes({ confirmed: true }),
		onSuccess: () => {
			dispatchToastMessage({ type: 'success', message: t('ABAC_Room_removed', { roomName }) });
		},
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: ABACQueryKeys.rooms.all() });
			onClose();
		},
	});

	return (
		<GenericModal
			variant='danger'
			icon={null}
			title={t('ABAC_Delete_room')}
			annotation={t('ABAC_Delete_room_annotation')}
			confirmText={t('Remove')}
			onConfirm={() => deleteMutation.mutate()}
			onCancel={onClose}
		>
			<Trans i18nKey='ABAC_Delete_room_content' values={{ roomName }} components={{ bold: <Box is='span' fontWeight='bold' /> }} />
		</GenericModal>
	);
};

export default DeleteRoomModal;
