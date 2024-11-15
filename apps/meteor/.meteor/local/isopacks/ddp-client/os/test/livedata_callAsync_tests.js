if (Meteor.isServer) {
  Meteor.methods({
    "server-only"() {
      return "result";
    },
  });
}

Meteor.methods({
  "client-only"() {
    return "result";
  },
});

Tinytest.addAsync(
  "livedata stub - callAsync works like in 2.x",
  async function (t) {
    let result = await Meteor.callAsync("server-only");
    t.equal(result, "result");

    result = await Meteor.callAsync("client-only");
    t.equal(result, "result");
  }
);
