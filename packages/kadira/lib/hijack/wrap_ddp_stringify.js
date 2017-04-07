wrapStringifyDDP = function() {
  var originalStringifyDDP = DDPCommon.stringifyDDP;

  DDPCommon.stringifyDDP = function(msg) {
    var msgString = originalStringifyDDP(msg);
    var msgSize = Buffer.byteLength(msgString, 'utf8');

    var kadiraInfo = Kadira._getInfo(null, true);

    if(kadiraInfo) {
      if(kadiraInfo.trace.type === 'method') {
        Kadira.models.methods.trackMsgSize(kadiraInfo.trace.name, msgSize);
      }

      return msgString;
    }

    // 'currentSub' is set when we wrap Subscription object and override
    // handlers for 'added', 'changed', 'removed' events. (see lib/hijack/wrap_subscription.js)
    if(Kadira.env.currentSub) {
      if(Kadira.env.currentSub.__kadiraInfo){
        Kadira.models.pubsub.trackMsgSize(Kadira.env.currentSub._name, "initialSent", msgSize);
        return msgString;
      }
      Kadira.models.pubsub.trackMsgSize(Kadira.env.currentSub._name, "liveSent", msgSize);
      return msgString;
    }

    Kadira.models.methods.trackMsgSize("<not-a-method-or-a-pub>", msgSize);
    return msgString;
  }
}
