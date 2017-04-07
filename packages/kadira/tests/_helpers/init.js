Kadira.connect('foo', 'bar', {enableErrorTracking: true});
var http = Npm.require('http');
var Future = Npm.require('fibers/future');

var server3301 = new Future();
var server8808 = new Future();

http.createServer(function(req, res) {
  res.writeHead(200);
  res.end('hello');
}).listen(3301, server3301.return.bind(server3301));

http.createServer(function(req, res) {
  var data = "";
  req.on('data', function(d) {
    data += d.toString();
  });

  req.on('end', function() {
    if(req.url == '/echo') {
      var sendData = {success: true};
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST',
        'Access-Control-Allow-Headers': 'Content-Type'
      });

      if(req.headers['content-type'] == 'application/json') {
        data = JSON.parse(data);
        sendData = {echo: data};
      }

      res.end(JSON.stringify(sendData));
    } else {
      res.writeHead(400, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
      res.end('internal-error-here');
    }
  });

}).listen(8808, server8808.return.bind(server8808));

server3301.wait();
server8808.wait();

// TODO use RegisterPublication instead of these

Meteor.publish('tinytest-data', function() {
  return TestData.find();
});

Meteor.publish('tinytest-data-with-no-oplog', function() {
  return TestData.find({}, {_disableOplog: true});
});

Meteor.publish('tinytest-data-random', function() {
  return TestData.find({aa: {$ne: Random.id()}});
});

Meteor.publish('tinytest-data-cursor-fetch', function() {
  var data = TestData.find({}).fetch();
  this.ready();
});

Meteor.publish('tinytest-data-2', function() {
  return TestData.find();
});

Meteor.publish('tinytest-data-delayed', function() {
  Meteor._wrapAsync(function(done) {
    setTimeout(done, 200);
  })();
  return TestData.find();
});

(function () {
  var doneOnce = false;
  Meteor.publish('tinytest-data-multi', function() {
    var pub = this;
    Meteor._wrapAsync(function(done) {
      setTimeout(function() {
        if(!doneOnce) {
          pub.ready();
          doneOnce = true;
          setTimeout(function() {
            pub.ready();
          }, 500);
        }
      }, 400);
    })();
  });
})();

(function () {
  var original = Kadira.models.methods.processMethod;
  Kadira.models.methods.processMethod = function(method) {
    MethodStore.push(method);
    original.call(Kadira.models.methods, method);
  };
})();
