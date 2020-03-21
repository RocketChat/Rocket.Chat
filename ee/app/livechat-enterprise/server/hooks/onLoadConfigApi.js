import { callbacks } from '../../../../../app/callbacks';
import { settings } from '../../../../../app/settings';
import { LivechatInquiry } from '../../../../../app/models/server';
import { normalizeQueueInfo } from '../lib/Helper';

callbacks.add('livechat.onLoadConfigApi', async (room) => {
	if (!room) {
		return null;
	}

	if (!settings.get('Livechat_waiting_queue')) {
		return null;
	}

	const { _id: rid } = room;
	const inquiry = LivechatInquiry.findOneByRoomId(rid);
	if (!inquiry) {
		return null;
	}

	const { _id, status } = inquiry;
	if (status !== 'queued') {
		return null;
	}

	const [inq] = await LivechatInquiry.getCurrentSortedQueueAsync({ _id });

	let queueInfo;
	if (inq) {
		const { position, department } = inq;
		queueInfo = await normalizeQueueInfo({ position, department });
	}

	return { queueInfo };
}, callbacks.priority.MEDIUM, 'livechat-on-load-config-api');
