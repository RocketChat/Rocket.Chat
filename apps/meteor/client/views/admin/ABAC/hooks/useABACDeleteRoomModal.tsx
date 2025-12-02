import { useSetModal, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import { useEndpointMutation } from '../../../../hooks/useEndpointMutation';
import { queryClient } from '../../../../lib/queryClient';
import { ABACQueryKeys } from '../../../../lib/queryKeys';
import ABACDeleteRoomModal from '../ABACDeleteRoomModal';

const useABACDeleteRoomModal = (room: { rid: string; name: string }) => {
	const { t } = useTranslation();
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();

	const deleteMutation = useEndpointMutation('DELETE', '/v1/abac/rooms/:rid/attributes', {
		keys: { rid: room.rid },
		onSuccess: () => {
			dispatchToastMessage({ type: 'success', message: t('ABAC_Room_removed', { roomName: room.name }) });
		},
		onError: (error) => {
			dispatchToastMessage({ type: 'error', message: error });
		},
		onSettled: () => {
			queryClient.invalidateQueries({ queryKey: ABACQueryKeys.rooms.all() });
			setModal(null);
		},
	});

	return () => {
		return setModal(
			<ABACDeleteRoomModal onClose={() => setModal(null)} onConfirm={() => deleteMutation.mutateAsync(undefined)} roomName={room.name} />,
		);
	};
};

export default useABACDeleteRoomModal;
