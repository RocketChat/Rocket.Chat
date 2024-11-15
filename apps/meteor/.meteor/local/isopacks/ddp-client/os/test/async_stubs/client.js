let events = [];
Meteor.methods({
  "sync-stub"() {
    events.push("sync-stub");
    return "sync-stub-result";
  },
  async "async-stub"() {
    events.push("start async-stub");
    await 0;
    events.push("end async-stub");
    return "async-stub-result";
  },
  callAsyncFromSyncStub() {
    events.push("callAsyncFromSyncStub");
    Meteor.callAsync("async-stub");
  },
  async callSyncStubFromAsyncStub() {
    events.push("start callSyncStubFromAsyncStub");
    await 0;
    let result = Meteor.call("sync-stub");
    events.push("end callSyncStubFromAsyncStub");
    return result;
  },
  callSyncStubFromSyncStub() {
    events.push("callSyncStubFromSyncStub");
    return Meteor.call("sync-stub");
  },
  callAsyncStubFromAsyncStub() {
    events.push("callAsyncStubFromAsyncStub");
    return Meteor.callAsync("async-stub");
  },
});

Tinytest.addAsync("applyAsync - server only", async function (test) {
  let serverResolver;
  let serverPromise = new Promise((resolve) => {
    serverResolver = resolve;
  });

  let stubResult = await Meteor.applyAsync(
    "server-only-sync",
    [],
    { returnStubValue: true },
    (err, result) => {
      console.log(err);
      if (!err) {
        serverResolver(result);
      }
    }
  );

  let serverResult = await serverPromise;

  test.equal(stubResult, undefined);
  test.equal(serverResult, "sync-result");
});

Tinytest.addAsync("applyAsync - sync stub", async function (test) {
  let serverResolver;
  let serverPromise = new Promise((resolve) => {
    serverResolver = resolve;
  });

  let stubResult = await Meteor.applyAsync(
    "sync-stub",
    [],
    {
      returnStubValue: true,
    },
    (err, result) => {
      console.log(err);
      if (!err) {
        serverResolver(result);
      }
    }
  );

  let serverResult = await serverPromise;

  test.equal(stubResult, "sync-stub-result");
  test.equal(serverResult, "sync-server-result");
});

Tinytest.addAsync("applyAsync - callAsync", async function (test) {
  let serverResult = await Meteor.callAsync("async-stub");

  test.equal(serverResult, "async-server-result");
});

Tinytest.addAsync("applyAsync - callAsync twice", async function (test) {
  events = [];
  let promise1 = Meteor.callAsync("async-stub");
  let promise2 = Meteor.callAsync("async-stub");

  console.log("PROMISESS", promise1, promise2);
  let results = await Promise.all([promise1, promise2]);

  test.equal(events, [
    "start async-stub",
    "end async-stub",
    "start async-stub",
    "end async-stub",
  ]);
  test.equal(results, ["async-server-result", "async-server-result"]);
});

// Broken in Meteor 2.13: https://github.com/meteor/meteor/issues/12889#issue-1998128607
Tinytest.addAsync(
  "applyAsync - callAsync from async stub",
  async function (test) {
    await Meteor.callAsync("getAndResetEvents");
    events = [];
    let serverResolver;
    let serverPromise = new Promise((resolve) => {
      serverResolver = resolve;
    });
    let stubResult = await Meteor.applyAsync(
      "callAsyncStubFromAsyncStub",
      [],
      { returnStubValue: true },
      (err, result) => {
        if (!err) {
          serverResolver(result);
        }
      }
    );
    let serverResult = await serverPromise;

    let serverEvents = await Meteor.callAsync("getAndResetEvents");

    test.equal(stubResult, "async-stub-result");
    test.equal(serverResult, "server result");
    test.equal(events, [
      "callAsyncStubFromAsyncStub",
      "start async-stub",
      "end async-stub",
    ]);
    test.equal(serverEvents, ["callAsyncStubFromAsyncStub"]);
  }
);

Tinytest.addAsync("applyAsync - callAsync in then", async function (test) {
  await Meteor.callAsync("getAndResetEvents");

  events = [];
  let result = await Meteor.callAsync("async-stub").then(() =>
    Meteor.callAsync("async-stub")
  );
  let serverEvents = await Meteor.callAsync("getAndResetEvents");

  test.equal(events, [
    "start async-stub",
    "end async-stub",
    "start async-stub",
    "end async-stub",
  ]);
  test.equal(serverEvents, ["async-stub", "async-stub"]);
  test.equal(result, "async-server-result");
});

Tinytest.addAsync("applyAsync - call from async stub", async function (test) {
  await Meteor.callAsync("getAndResetEvents");
  events = [];
  let serverResolver;
  let serverPromise = new Promise((resolve) => {
    serverResolver = resolve;
  });
  let stubResult = await Meteor.applyAsync(
    "callSyncStubFromAsyncStub",
    [],
    { returnStubValue: true },
    (err, result) => {
      if (!err) {
        serverResolver(result);
      }
    }
  );
  let serverResult = await serverPromise;

  let serverEvents = await Meteor.callAsync("getAndResetEvents");

  test.equal(stubResult, "sync-stub-result");
  test.equal(serverResult, "server result");
  test.equal(events, [
    "start callSyncStubFromAsyncStub",
    "sync-stub",
    "end callSyncStubFromAsyncStub",
  ]);
  test.equal(serverEvents, ["callSyncStubFromAsyncStub"]);
});

Tinytest.addAsync("apply - call from sync stub", async function (test) {
  await Meteor.callAsync("getAndResetEvents");
  events = [];
  let serverResolver;
  let serverPromise = new Promise((resolve) => {
    serverResolver = resolve;
  });
  let stubResult = Meteor.apply(
    "callSyncStubFromSyncStub",
    [],
    { returnStubValue: true },
    (err, result) => {
      if (!err) {
        serverResolver(result);
      }
    }
  );
  let serverResult = await serverPromise;

  let serverEvents = await Meteor.callAsync("getAndResetEvents");

  test.equal(stubResult, "sync-stub-result");
  test.equal(serverResult, "server result");
  test.equal(events, ["callSyncStubFromSyncStub", "sync-stub"]);
  test.equal(serverEvents, ["callSyncStubFromSyncStub"]);
});

Tinytest.addAsync(
  "apply - proper order with applyAsync",
  async function (test) {
    await Meteor.callAsync("getAndResetEvents");
    events = [];
    let serverResolver;
    let serverPromise = new Promise((resolve) => {
      serverResolver = resolve;
    });

    let promise1 = Meteor.callAsync("callSyncStubFromAsyncStub");
    let stubResult = Meteor.apply(
      "callSyncStubFromSyncStub",
      [],
      { returnStubValue: true },
      (err, result) => {
        if (!err) {
          serverResolver(result);
        }
      }
    );
    let promise2 = Meteor.callAsync("server-only-sync");
    let [serverResult, result1, result2] = await Promise.all([
      serverPromise,
      promise1,
      promise2,
    ]);

    let serverEvents = await Meteor.callAsync("getAndResetEvents");

    test.equal(stubResult, "sync-stub-result");
    test.equal(serverResult, "server result");
    test.equal(result1, "server result");
    test.equal(result2, "sync-result");
    test.equal(events, [
      "callSyncStubFromSyncStub",
      "sync-stub",
      "start callSyncStubFromAsyncStub",
      "sync-stub",
      "end callSyncStubFromAsyncStub",
    ]);
    test.equal(serverEvents, [
      "callSyncStubFromAsyncStub",
      "callSyncStubFromSyncStub",
      "server-only-sync",
    ]);
  }
);

Tinytest.addAsync("apply - wait", async function (test) {
  await Meteor.callAsync("getAndResetEvents");
  events = [];
  let serverResolver;
  let serverPromise = new Promise((resolve) => {
    serverResolver = resolve;
  });

  let stubResult = Meteor.apply(
    "callSyncStubFromSyncStub",
    [],
    { returnStubValue: true, wait: true },
    (err, result) => {
      if (!err) {
        serverResolver(result);
      }
    }
  );

  const serverResult = await serverPromise;

  test.equal(stubResult, "sync-stub-result");
  test.equal(serverResult, "server result");
});

Tinytest.addAsync(
  "apply - preserve order with subscriptions",
  async function (test) {
    await Meteor.callAsync("getAndResetEvents");
    let serverResolver;
    let serverPromise = new Promise((resolve) => {
      serverResolver = resolve;
    });
    let subResolver;
    let subPromise = new Promise((resolve) => {
      subResolver = resolve;
    });

    Meteor.call("server-only-sync", (err, result) => {
      if (!err) {
        serverResolver(result);
      }
    });

    let handle = Meteor.subscribe("simple-publication", () => subResolver());

    await serverPromise;
    await subPromise;
    handle.stop();

    let serverEvents = await Meteor.callAsync("getAndResetEvents");

    test.equal(serverEvents, ["server-only-sync", "publication"]);
  }
);

Tinytest.addAsync(
  "method interaction with unblocking mechanism",
  async function (test) {
    await Meteor.callAsync("getAndResetEvents");

    await Promise.all([
      Meteor.callAsync("unblockedMethod", { delay: 200 }), // unblock + sleep for 200 milliseconds
      Meteor.callAsync("blockingMethod"), // run straight + block
    ]);

    let serverEvents = await Meteor.callAsync("getAndResetEvents");
    test.equal(
      serverEvents,
      ["unblock start", "blockingMethod", "unblock end"],
      "should have properly executed the unblocking mechanism"
    );
  }
);
