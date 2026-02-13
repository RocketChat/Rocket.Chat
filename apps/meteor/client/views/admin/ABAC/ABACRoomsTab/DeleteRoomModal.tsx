import type { IRoom } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { GenericModal } from '@rocket.chat/ui-client';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import { Trans, useTranslation } from 'react-i18next';

import { useEndpointMutation } from '../../../../hooks/useEndpointMutation';
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
	const deleteMutation = useEndpointMutation('DELETE', '/v1/abac/rooms/:rid/attributes', {
		keys: { rid },
		onSuccess: () => {
			dispatchToastMessage({ type: 'success', message: t('ABAC_Room_removed', { roomName }) });
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
			onConfirm={() => deleteMutation.mutate(undefined)}
			onCancel={onClose}
		>
			<Trans i18nKey='ABAC_Delete_room_content' values={{ roomName }} components={{ bold: <Box is='span' fontWeight='bold' /> }} />
		</GenericModal>
	);
};

export default DeleteRoomModal;
