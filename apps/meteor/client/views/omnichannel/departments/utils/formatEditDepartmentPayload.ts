import type { EditDepartmentFormData } from '../definitions';

export const formatEditDepartmentPayload = (data: EditDepartmentFormData) => {
	const {
		enabled,
		name,
		description,
		showOnRegistration,
		showOnOfflineForm,
		email,
		chatClosingTags,
		offlineMessageChannelName,
		maxNumberSimultaneousChat,
		visitorInactivityTimeoutInSeconds,
		abandonedRoomsCloseCustomMessage,
		waitingQueueMessage,
		departmentsAllowedToForward,
		fallbackForwardDepartment,
		allowReceiveForwardOffline,
		requestTagBeforeClosingChat,
		unit,
	} = data;

	return {
		enabled,
		name,
		description,
		showOnRegistration,
		showOnOfflineForm,
		requestTagBeforeClosingChat,
		email,
		chatClosingTags,
		offlineMessageChannelName,
		maxNumberSimultaneousChat,
		visitorInactivityTimeoutInSeconds,
		abandonedRoomsCloseCustomMessage,
		waitingQueueMessage,
		departmentsAllowedToForward: departmentsAllowedToForward?.map((dep) => dep.value),
		fallbackForwardDepartment,
		allowReceiveForwardOffline,
		departmentUnit: { id: unit === 'no-unit-selected' ? undefined : unit },
	};
};
