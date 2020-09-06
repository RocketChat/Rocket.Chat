import { Stream } from '../Streamer';
import { STREAM_NAMES } from '../constants';
import { Authorization } from '../../../../../server/sdk';

export const streamLivechatInquiry = new Stream(STREAM_NAMES.LIVECHAT_INQUIRY);
streamLivechatInquiry.allowRead(function() {
	return Authorization.hasPermission(this.uid, 'view-l-room');
});
