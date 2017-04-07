var originalCall = HTTP.call;

HTTP.call = function(method, url) {
  var kadiraInfo = Kadira._getInfo();
  if(kadiraInfo) {
    var eventId = Kadira.tracer.event(kadiraInfo.trace, 'http', {method: method, url: url});
  }

  try {
    var response = originalCall.apply(this, arguments);

    //if the user supplied an asynCallback, we don't have a response object and it handled asynchronously
    //we need to track it down to prevent issues like: #3
    var endOptions = HaveAsyncCallback(arguments)? {async: true}: {statusCode: response.statusCode};
    if(eventId) {
      Kadira.tracer.eventEnd(kadiraInfo.trace, eventId, endOptions);
    }
    return response;
  } catch(ex) {
    if(eventId) {
      Kadira.tracer.eventEnd(kadiraInfo.trace, eventId, {err: ex.message});
    }
    throw ex;
  }
};