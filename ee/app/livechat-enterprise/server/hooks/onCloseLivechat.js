import { callbacks } from '../../../../../app/callbacks';
import { debouncedDispatchWaitingQueueStatus } from '../lib/Helper';
import { LivechatEnterprise } from '../lib/LivechatEnterprise';

const onCloseLivechat = (room) => {
	Promise.await(LivechatEnterprise.releaseOnHoldChat(room));

	const { departmentId } = room || {};
	debouncedDispatchWaitingQueueStatus(departmentId);

	return room;
};

callbacks.add('livechat.closeRoom', onCloseLivechat, callbacks.priority.HIGH, 'livechat-waiting-queue-monitor-close-room');
