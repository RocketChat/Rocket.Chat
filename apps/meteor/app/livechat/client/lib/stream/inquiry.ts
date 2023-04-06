import { Meteor } from 'meteor/meteor';

import { LIVECHAT_INQUIRY_QUEUE_STREAM_OBSERVER } from '../../../lib/stream/constants';

export const inquiryDataStream = new Meteor.Streamer(LIVECHAT_INQUIRY_QUEUE_STREAM_OBSERVER);
