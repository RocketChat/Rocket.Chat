import { LIVECHAT_INQUIRY_DATA_STREAM_OBSERVER } from '../../../lib/stream/constants';

export const inquiryDataStream = new Meteor.Streamer(LIVECHAT_INQUIRY_DATA_STREAM_OBSERVER);
