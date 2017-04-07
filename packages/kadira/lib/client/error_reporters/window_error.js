var prevWindowOnError = window.onerror || Function.prototype;

window.onerror = function(message, url, line, col, error) {
  // track only if error tracking is enabled
  if(!Kadira.options.enableErrorTracking) {
    return prevWindowOnError(message, url, line, col, error);
  }

  url = url || '<anonymous>';
  line = line || 0;
  col = col || 0;

  if(error) {
    var stack = error.stack;
  } else {
    var stack = 'Error:\n    at window.onerror ('+url+':'+line+':'+col+')';
  }

  var now = (new Date().getTime());
  Kadira.errors.sendError({
    appId : Kadira.options.appId,
    name : message,
    type : 'client',
    startTime : now,
    subType : 'window.onerror',
    info : getBrowserInfo(),
    stacks : JSON.stringify([{at: now, events: [], stack: stack}]),
  });

  return prevWindowOnError(message, url, line, col, error);;
}
