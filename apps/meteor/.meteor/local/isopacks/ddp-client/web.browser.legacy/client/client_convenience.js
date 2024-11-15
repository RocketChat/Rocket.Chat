import { DDP } from '../common/namespace.js';
import { Meteor } from 'meteor/meteor';
import { loadAsyncStubHelpers } from "./queueStubsHelpers";

// Meteor.refresh can be called on the client (if you're in common code) but it
// only has an effect on the server.
Meteor.refresh = () => {};

// By default, try to connect back to the same endpoint as the page
// was served from.
//
// XXX We should be doing this a different way. Right now we don't
// include ROOT_URL_PATH_PREFIX when computing ddpUrl. (We don't
// include it on the server when computing
// DDP_DEFAULT_CONNECTION_URL, and we don't include it in our
// default, '/'.) We get by with this because DDP.connect then
// forces the URL passed to it to be interpreted relative to the
// app's deploy path, even if it is absolute. Instead, we should
// make DDP_DEFAULT_CONNECTION_URL, if set, include the path prefix;
// make the default ddpUrl be '' rather that '/'; and make
// _translateUrl in stream_client_common.js not force absolute paths
// to be treated like relative paths. See also
// stream_client_common.js #RationalizingRelativeDDPURLs
const runtimeConfig = typeof __meteor_runtime_config__ !== 'undefined' ? __meteor_runtime_config__ : Object.create(null);
const ddpUrl = runtimeConfig.DDP_DEFAULT_CONNECTION_URL || '/';

const retry = new Retry();

function onDDPVersionNegotiationFailure(description) {
  Meteor._debug(description);
  if (Package.reload) {
    const migrationData = Package.reload.Reload._migrationData('livedata') || Object.create(null);
    let failures = migrationData.DDPVersionNegotiationFailures || 0;
    ++failures;
    Package.reload.Reload._onMigrate('livedata', () => [true, { DDPVersionNegotiationFailures: failures }]);
    retry.retryLater(failures, () => {
      Package.reload.Reload._reload({ immediateMigration: true });
    });
  }
}

// Makes sure to inject the stub async helpers before creating the connection
loadAsyncStubHelpers();

Meteor.connection = DDP.connect(ddpUrl, {
  onDDPVersionNegotiationFailure: onDDPVersionNegotiationFailure
});

// Proxy the public methods of Meteor.connection so they can
// be called directly on Meteor.
[
  'subscribe',
  'methods',
  'isAsyncCall',
  'call',
  'callAsync',
  'apply',
  'applyAsync',
  'status',
  'reconnect',
  'disconnect'
].forEach(name => {
  Meteor[name] = Meteor.connection[name].bind(Meteor.connection);
});
