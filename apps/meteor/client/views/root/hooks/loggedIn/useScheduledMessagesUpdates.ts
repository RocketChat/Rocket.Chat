import { useCanScheduleMessages } from '../../../../hooks/useCanScheduleMessages';
import { useScheduledMessages } from '../../../../hooks/useScheduledMessages';

export const useScheduledMessagesUpdates = () => {
	useScheduledMessages({ enabled: useCanScheduleMessages() });
};
