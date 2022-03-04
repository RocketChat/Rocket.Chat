// We need a function that treats thrown errors exactly like Iron Router would.
// This file is written in JavaScript to enable copy-pasting Iron Router code.

// Taken from: https://github.com/iron-meteor/iron-router/blob/9c369499c98af9fd12ef9e68338dee3b1b1276aa/lib/router_server.js#L3
/*
var env = process.env.NODE_ENV || 'development';
*/

// Taken from: https://github.com/iron-meteor/iron-router/blob/9c369499c98af9fd12ef9e68338dee3b1b1276aa/lib/router_server.js#L47

/*
ironRouterSendErrorToResponse = function (err, req, res) {
  if (res.statusCode < 400)
    res.statusCode = 500;

  if (err.status)
    res.statusCode = err.status;

  if (env === 'development')
    msg = (err.stack || err.toString()) + '\n';
  else
    //XXX get this from standard dict of error messages?
    msg = 'Server error.';

  console.error(err.stack || err.toString());

  if (res.headersSent)
    return req.socket.destroy();

  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Content-Length', Buffer.byteLength(msg));
  if (req.method === 'HEAD')
    return res.end();
  res.end(msg);
  return;
}
*/
