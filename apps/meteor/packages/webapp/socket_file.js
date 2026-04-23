import { statSync, unlinkSync, existsSync } from 'fs';

// Since a new socket file will be created when the HTTP server
// starts up, if found remove the existing file.
//
// WARNING:
// This will remove the configured socket file without warning. If
// the configured socket file is already in use by another application,
// it will still be removed. Node does not provide a reliable way to
// differentiate between a socket file that is already in use by
// another application or a stale socket file that has been
// left over after a SIGKILL. Since we have no reliable way to
// differentiate between these two scenarios, the best course of
// action during startup is to remove any existing socket file. This
// is not the safest course of action as removing the existing socket
// file could impact an application using it, but this approach helps
// ensure the HTTP server can startup without manual
// intervention (e.g. asking for the verification and cleanup of socket
// files before allowing the HTTP server to be started).
//
// The above being said, as long as the socket file path is
// configured carefully when the application is deployed (and extra
// care is taken to make sure the configured path is unique and doesn't
// conflict with another socket file path), then there should not be
// any issues with this approach.
export const removeExistingSocketFile = (socketPath) => {
  try {
    if (statSync(socketPath).isSocket()) {
      // Since a new socket file will be created, remove the existing
      // file.
      unlinkSync(socketPath);
    } else {
      throw new Error(
        `An existing file was found at "${socketPath}" and it is not ` +
        'a socket file. Please confirm PORT is pointing to valid and ' +
        'un-used socket file path.'
      );
    }
  } catch (error) {
    // If there is no existing socket file to cleanup, great, we'll
    // continue normally. If the caught exception represents any other
    // issue, re-throw.
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
};

// Remove the socket file when done to avoid leaving behind a stale one.
// Note - a stale socket file is still left behind if the running node
// process is killed via signal 9 - SIGKILL.
export const registerSocketFileCleanup =
  (socketPath, eventEmitter = process) => {
    ['exit', 'SIGINT', 'SIGHUP', 'SIGTERM'].forEach(signal => {
      eventEmitter.on(signal, Meteor.bindEnvironment(() => {
        if (existsSync(socketPath)) {
          unlinkSync(socketPath);
        }
      }));
    });
  };
