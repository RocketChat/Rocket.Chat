var originalSend = Email.send;

Email.send = function(options) {
  var kadiraInfo = Kadira._getInfo();
  if(kadiraInfo) {
    var data = _.pick(options, 'from', 'to', 'cc', 'bcc', 'replyTo');
    var eventId = Kadira.tracer.event(kadiraInfo.trace, 'email', data);
  }
  try {
    var ret = originalSend.call(this, options);
    if(eventId) {
      Kadira.tracer.eventEnd(kadiraInfo.trace, eventId);
    }
    return ret;
  } catch(ex) {
    if(eventId) {
      Kadira.tracer.eventEnd(kadiraInfo.trace, eventId, {err: ex.message});
    }
    throw ex;
  }
};