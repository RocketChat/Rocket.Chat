let events = [];

Meteor.methods({
  getAndResetEvents() {
    let oldEvents = events;
    events = [];

    return oldEvents;
  },
  'server-only-sync' () {
    events.push('server-only-sync');
    return 'sync-result';
  },
  async 'server-only-async' () {
    events.push('server-only-async');
    await 0
    return 'server-only-async-result';
  },
  'sync-stub' () {
    events.push('sync-stub');
    return 'sync-server-result'
  },
  'async-stub' () {
    events.push('async-stub');
    return 'async-server-result'
  },
  'callAsyncFromSyncStub'() {
    events.push('callAsyncFromSyncStub');
  },
  'callSyncStubFromAsyncStub'() {
    events.push('callSyncStubFromAsyncStub');

    return 'server result';
  },
  'callSyncStubFromSyncStub'() {
    events.push('callSyncStubFromSyncStub');
    return 'server result';
  },
  'callAsyncStubFromAsyncStub'() {
    events.push('callAsyncStubFromAsyncStub');

    return 'server result';
  },
  async 'unblockedMethod'({ delay }) {
    events.push('unblock start');
    this.unblock();
    await Meteor._sleepForMs(delay);
    events.push('unblock end');
  },
  'blockingMethod'() {
    events.push('blockingMethod');
  },
});

Meteor.publish("simple-publication", function () {
  events.push("publication");
  this.ready();
});
