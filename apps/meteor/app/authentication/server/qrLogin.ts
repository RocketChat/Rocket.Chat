import { Meteor } from 'meteor/meteor';

const qrLoginStreamer = new Meteor.Streamer('qr-login');

qrLoginStreamer.allowRead(function() {
    return true; // Allow all reads
});

qrLoginStreamer.allowWrite(function() {
    return false; // Disallow all writes
});

export { qrLoginStreamer };