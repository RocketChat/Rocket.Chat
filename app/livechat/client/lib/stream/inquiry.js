import { Meteor } from 'meteor/meteor';

import { OMNICHANNEL_INQUIRY_DATA_STREAM_OBSERVER } from '../../../lib/stream/constants';

export const inquiryDataStream = new Meteor.Streamer(OMNICHANNEL_INQUIRY_DATA_STREAM_OBSERVER);
