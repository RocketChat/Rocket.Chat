import { writeFileSync, unlinkSync, statSync, readFileSync } from 'fs';
import { createServer } from 'net';
import { createServer as createServerHttp } from 'http';
import {
  removeExistingSocketFile,
  registerSocketFileCleanup,
} from './socket_file.js';
import { EventEmitter } from 'events';
import { tmpdir, userInfo, platform } from 'os';
import { main, getGroupInfo } from './webapp_server';
import express from 'express';

const testSocketFile = `${tmpdir()}/socket_file_tests`;

const getChownInfo = async (filePath) => {
  try {
    const stats = await statSync(filePath);
    return { uid: stats.uid, gid: stats.gid };
  } catch (error) {
    console.error(`Error fetching ownership info for ${filePath}:`, error.message);
    return null;
  }
};

const isMacOS = () => {
  return platform() === 'darwin';
};

// Resolve the current process's primary group name by looking up its GID in
// /etc/group. This is used in tests that chown a socket file: we need a group
// the running user actually belongs to, so the chown doesn't fail with EPERM.
const getCurrentGroupName = () => {
  try {
    const gid = userInfo().gid;
    const lines = readFileSync('/etc/group', 'utf8').split('\n');
    const match = lines.find(line => parseInt(line.split(':')[2], 10) === gid);
    return match ? match.split(':')[0] : null;
  } catch (_) {
    return null;
  }
};

const getGroupToUse = () => {
  if (isMacOS()) {
    return 'staff';
  }

  return getCurrentGroupName() || 'root';
};

const removeTestSocketFile = () => {
  try {
    unlinkSync(testSocketFile);
  } catch (error) {
    // Do nothing
  }
}

Tinytest.add("socket file - don't remove a non-socket file", test => {
  writeFileSync(testSocketFile, "");
  test.throws(
    () => { removeExistingSocketFile(testSocketFile); },
    /An existing file was found/
  );
  removeTestSocketFile()
});

Tinytest.addAsync(
  'socket file - remove a previously existing socket file',
  (test, done) => {
    removeTestSocketFile();
    const server = createServer();
    server.listen(testSocketFile);

    server.on('listening', Meteor.bindEnvironment(() => {
      test.isNotUndefined(statSync(testSocketFile));
      removeExistingSocketFile(testSocketFile);
      test.throws(
        () => { statSync(testSocketFile); },
        /ENOENT/
      );
      server.close();
      done();
    }));
  }
);

Tinytest.add(
  'socket file - no existing socket file, nothing to remove',
  test => {
    removeTestSocketFile();
    removeExistingSocketFile(testSocketFile);
  }
);

Tinytest.add('socket file - remove socket file on exit', test => {
  const testEventEmitter = new EventEmitter();
  registerSocketFileCleanup(testSocketFile, testEventEmitter);
  ['exit', 'SIGINT', 'SIGHUP', 'SIGTERM'].forEach(signal => {
    writeFileSync(testSocketFile, "");
    test.isNotUndefined(statSync(testSocketFile));
    testEventEmitter.emit(signal);
    test.throws(
      () => { statSync(testSocketFile); },
      /ENOENT/
    );
  });
});

function prepareServer() {
  removeTestSocketFile();
  removeExistingSocketFile(testSocketFile);
  const testEventEmitter = new EventEmitter();
  registerSocketFileCleanup(testSocketFile, testEventEmitter);
  const server = createServer();
  server.listen(testSocketFile);
  const app = express();
  const httpServer = createServerHttp(app);
  return { httpServer, server };
}

function closeServer({ httpServer, server }) {
  return new Promise((resolve) => {
    httpServer.on(
      "listening",
      Meteor.bindEnvironment(() => {
        process.env.UNIX_SOCKET_PATH = "";
        process.env.UNIX_SOCKET_GROUP = "";
        removeExistingSocketFile(testSocketFile);
        server.close();
        httpServer.close();
        resolve();
      })
    );
  });
}

testAsyncMulti(
  "socket usage - use socket file for inter-process communication",
  [
    async (test) => {
      // use UNIX_SOCKET_PATH
      const { httpServer, server } = prepareServer();

      process.env.UNIX_SOCKET_PATH = testSocketFile;
      const result = await main({ httpServer });

      test.equal(result, "DAEMON");
      const currentGid = userInfo({ encoding: "utf8" })?.gid;
      test.equal((await getChownInfo(testSocketFile))?.gid, currentGid);

      return closeServer({ httpServer, server });
    },
    async (test) => {
      // use UNIX_SOCKET_PATH and UNIX_SOCKET_GROUP
      const { httpServer, server } = prepareServer();

      const groupToUse = getGroupToUse();
      process.env.UNIX_SOCKET_PATH = testSocketFile;
      process.env.UNIX_SOCKET_GROUP = groupToUse;
      process.env.UNIX_SOCKET_PERMISSIONS = '777';
      const result = await main({ httpServer });

      test.equal(result, "DAEMON");
      test.equal((await getChownInfo(testSocketFile))?.gid, getGroupInfo(process.env.UNIX_SOCKET_GROUP)?.gid);

      return closeServer({ httpServer, server });
    },
  ]
);
