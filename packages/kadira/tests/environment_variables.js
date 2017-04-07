Tinytest.add(
  'AutoConnect - connect with environment variables',
  function (test) {
    var originalEnv = process.env;
    var originalConnect = Kadira.connect;

    process.env = {
      KADIRA_APP_ID: 'rcZSEaSgMaxH4c2df',
      KADIRA_APP_SECRET: '9af3daf3-64f3-4448-8b1e-4286fdf5f499',
      KADIRA_OPTIONS_CLIENT_ENGINE_SYNC_DELAY: '123',
      KADIRA_OPTIONS_ERROR_DUMP_INTERVAL: '234',
      KADIRA_OPTIONS_MAX_ERRORS_PER_INTERVAL: '345',
      KADIRA_OPTIONS_COLLECT_ALL_STACKS: 'true',
      KADIRA_OPTIONS_ENABLE_ERROR_TRACKING: 'false',
      KADIRA_OPTIONS_ENDPOINT: 'https://engine.kadira.io',
      KADIRA_OPTIONS_HOSTNAME: 'my-hostname',
      KADIRA_OPTIONS_PAYLOAD_TIMEOUT: '456',
      KADIRA_OPTIONS_PROXY: 'http://localhost:3128',
    };

    var connectArgs;
    Kadira.connect = function () {
      connectArgs = Array.prototype.slice.call(arguments);
    }

    Kadira._connectWithEnv();

    test.equal(connectArgs[0], 'rcZSEaSgMaxH4c2df');
    test.equal(connectArgs[1], '9af3daf3-64f3-4448-8b1e-4286fdf5f499');
    test.equal(connectArgs[2], {
      clientEngineSyncDelay: 123,
      errorDumpInterval: 234,
      maxErrorsPerInterval: 345,
      collectAllStacks: true,
      enableErrorTracking: false,
      endpoint: 'https://engine.kadira.io',
      hostname: 'my-hostname',
      payloadTimeout: 456,
      proxy: 'http://localhost:3128',
    });

    process.env = originalEnv;
    Kadira.connect = originalConnect;
  }
);
