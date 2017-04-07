var http = require('http');
var app = http.createServer(function(req, res) {
  console.log("AUTH:", req.headers);
  var data = "";
  req.on('data', ondata);
  req.once('end', onend);
  req.socket.setKeepAlive(false);

  res.writeHead(200);

  function ondata(d) {
    data += d.toString();
  }

  function onend() {
    console.log('DATA:', data);
    req.removeListener('data', ondata);
    res.end();
  }
});

var port = process.env.PORT || 11011;
console.log('Mock APM Engine started on port: ', port);
app.listen(port);

