import { useStream } from '@rocket.chat/ui-contexts';
import { useEffect } from 'preact/hooks';

import { onAgentChange, onAgentStatusChange, onQueuePositionChange } from '../lib/room';

export const useAgentChangeSubscription = (rid: string) => {
	const stream = useStream('livechat-room');

	useEffect(() => {
		if (!rid) {
			return;
		}
		return stream(`${rid}`, (data) => {
			if (data.type === 'agentData') {
				void onAgentChange(data.data);
			}
		});
	}, [rid, stream]);
};

export const useAgentStatusChangeSubscription = (rid: string) => {
	const stream = useStream('livechat-room');

	useEffect(() => {
		if (!rid) {
			return;
		}
		return stream(`${rid}`, (data) => {
			if (data.type === 'agentStatus') {
				onAgentStatusChange(data.status);
			}
		});
	}, [rid, stream]);
};

export const useQueuePositionChangeSubscription = (rid: string) => {
	const stream = useStream('livechat-room');

	useEffect(() => {
		if (!rid) {
			return;
		}
		return stream(`${rid}`, (data) => {
			if (data.type === 'queueData') {
				void onQueuePositionChange(data.data);
			}
		});
	}, [rid, stream]);
};
