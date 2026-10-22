import { Meteor } from 'meteor/meteor';

// Meteor 3.5 keeps a dropped DDP session for 15s so the client can resume it, which delays every
// connection.onClose hook (presence stays online after the browser closes). We keep the behavior from before
// 3.5 instead, the same as ddp-streamer in microservices: a session ends as soon as its socket closes.
// Resuming would not help anyway: streamers write straight to the socket, past the queue Meteor replays.
Meteor.server.options.disconnectGracePeriod = 0;
