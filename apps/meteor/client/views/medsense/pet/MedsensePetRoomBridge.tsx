import { useEndpoint, useRouter, useRoomToolbox } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';

import { clearMedsensePetRoomState, setMedsensePetRoomState } from './MedsensePetRoomState';
import { useRoom } from '../../room/contexts/RoomContext';

const getUnqualifiedActionId = (actionId?: string): string | undefined => actionId?.split(':').pop();

const MedsensePetRoomBridge = (): null => {
	const room = useRoom();
	const router = useRouter();
	const toolbox = useRoomToolbox();
	const getRequestManagementContext = useEndpoint('GET', '/v1/medsense/context.requestManagement');
	const roomWithMedsense = room as typeof room & {
		medsenseActiveRequestId?: string;
		medsenseActiveRequestStatus?: string | null;
		medsenseAssigned?: string | null;
	};
	const { data: requestManagementContext } = useQuery({
		queryKey: ['medsense-pet-room-request-management-context', room._id],
		queryFn: () => getRequestManagementContext({ roomId: room._id }),
		enabled: Boolean(room._id),
		refetchInterval: 5000,
		retry: false,
	});
	const activeRequestId = roomWithMedsense.medsenseActiveRequestId || requestManagementContext?.context.requestId;
	const activeRequestStatus = roomWithMedsense.medsenseActiveRequestStatus || requestManagementContext?.context.requestStatus;
	const assigned = roomWithMedsense.medsenseAssigned || requestManagementContext?.context.assigned;
	const specialtyActionId = getUnqualifiedActionId(requestManagementContext?.context.specialtyActionId);
	const requestManagementAction = toolbox.actions.find((action) => {
		const searchableAction = `${action.id} ${action.title}`.toLowerCase();
		return (
			action.type === 'apps' && ((specialtyActionId && action.id === specialtyActionId) || searchableAction.includes('request-management'))
		);
	});
	const roomActions = useMemo(
		() =>
			toolbox.actions
				.filter((action) => action.type === 'apps' && action.action)
				.map((action) => ({
					id: action.id,
					title: String(action.title),
					action: action.action as () => void,
				})),
		[toolbox.actions],
	);

	useEffect(() => {
		setMedsensePetRoomState({
			currentRoomId: room._id,
			currentRoomName: room.fname || room.name,
			routeName: router.getRouteName() || undefined,
			activeRequestId,
			activeRequestStatus: activeRequestStatus || undefined,
			assigned: assigned || undefined,
			isRoomView: true,
			roomActions,
			openRequestManagement: requestManagementAction?.action,
		});

		return () => clearMedsensePetRoomState(room._id);
	}, [
		room._id,
		room.fname,
		room.name,
		activeRequestId,
		activeRequestStatus,
		assigned,
		requestManagementAction?.action,
		roomActions,
		router,
	]);

	return null;
};

export default MedsensePetRoomBridge;
