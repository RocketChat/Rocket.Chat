
Tinytest.add(
  'Models - Method - buildPayload simple',
  function (test) {
    CreateMethodCompleted('aa', 'hello', 1, 100, 5);
    CreateMethodCompleted('aa', 'hello', 2, 800 , 10);
    var payload = model.buildPayload();
    var expected = {
      methodMetrics: [
        {
          startTime: 100,
          methods: {
            hello: {
              count: 2,
              errors: 0,
              wait: 0,
              db: 0,
              http: 0,
              email: 0,
              async: 0,
              compute: 7.5,
              total: 7.5,
              fetchedDocSize: 0,
              sentMsgSize: 0
            }
          }
        }
      ],
      methodRequests: []
    };

    var startTime = expected.methodMetrics[0].startTime;
    expected.methodMetrics[0].startTime = Kadira.syncedDate.syncTime(startTime);
    // TODO comparing without parsing and stringifing fails
    test.equal(EJSON.parse(EJSON.stringify(payload)), EJSON.parse(EJSON.stringify(expected)));
    CleanTestData();
  }
);

Tinytest.add(
  'Models - Method - buildPayload with errors',
  function (test) {
    CreateMethodCompleted('aa', 'hello', 1, 100, 5);
    CreateMethodErrored('aa', 'hello', 2, 'the-error', 800, 10);
    var payload = model.buildPayload();
    var expected = [{
      startTime: 100,
      methods: {
        hello: {
          count: 2,
          errors: 1,
          wait: 0,
          db: 0,
          http: 0,
          email: 0,
          async: 0,
          compute: 7.5,
          total: 7.5,
          fetchedDocSize: 0,
          sentMsgSize: 0
        }
      }
    }];
    // TODO comparing without stringify fails
    expected[0].startTime = Kadira.syncedDate.syncTime(expected[0].startTime);
    test.equal(EJSON.parse(EJSON.stringify(payload.methodMetrics)), EJSON.parse(EJSON.stringify(expected)));
    CleanTestData();
  }
);

Tinytest.add(
  'Models - Method - Metrics - fetchedDocSize',
  function (test) {
    var docs = [{data: 'data1'}, {data: 'data2'}];
    docs.forEach(function(doc) {TestData.insert(doc)});

    var methodId = RegisterMethod(function(){
      var data = TestData.find({}).fetch();
    });

    var client = GetMeteorClient();
    WithDocCacheGetSize(function () {
      client.call(methodId);
    }, 30);
    Wait(100);

    var payload = Kadira.models.methods.buildPayload();
    test.equal(payload.methodMetrics[0].methods[methodId].fetchedDocSize, 60);
    CleanTestData();
  }
);

Tinytest.add(
  'Models - Method - Metrics - sentMsgSize',
  function (test) {
    var docs = [{data: 'data1'}, {data: 'data2'}];
    docs.forEach(function(doc) {TestData.insert(doc)});

    var returnValue = "Some return value";
    var methodId = RegisterMethod(function(){
      var data = TestData.find({}).fetch();
      return returnValue;
    });

    var client = GetMeteorClient();
    client.call(methodId);

    var payload = Kadira.models.methods.buildPayload();

    var expected = (JSON.stringify({ msg: 'updated', methods: [ '1' ] }) +
        JSON.stringify({ msg: 'result', id: '1', result: returnValue })).length

    test.equal(payload.methodMetrics[0].methods[methodId].sentMsgSize, expected);
    CleanTestData();
  }
);

function GetPayload (buildDetailInfo) {
  return model.buildPayload(buildDetailInfo);
}

function CreateMethodCompleted (sessionName, methodName, methodId, startTime, methodDelay) {
  if(typeof model == 'undefined') {
    model = new MethodsModel();
  }
  methodDelay = methodDelay || 5;
  var method = {session: sessionName, name: methodName, id: methodId, events: []};
  method.events.push({type: 'start', at: startTime});
  method.events.push({type: 'complete', at: startTime + methodDelay});
  method = Kadira.tracer.buildTrace(method);
  model.processMethod(method);
}

function CreateMethodWithEvent (sessionName, methodName, methodId, startTime, eventName, eventDelay) {
  if(typeof model == 'undefined') {
    model = new MethodsModel();
  }
  var time = startTime;
  var method = {session: sessionName, name: methodName, id: methodId, events: []};
  method.events.push({type: 'start', at: time});
  method.events.push({type: eventName, at: time += 5});
  method.events.push({type: eventName + 'end', at: time += eventDelay});
  method.events.push({type: 'complete', at: time += 5});
  method = Kadira.tracer.buildTrace(method);
  model.processMethod(method);
}

function CreateMethodErrored (sessionName, methodName, methodId, errorMessage, startTime, methodDelay) {
  if(typeof model == 'undefined') {
    model = new MethodsModel();
  }
  methodDelay = methodDelay || 5;
  var method = {session: sessionName, name: methodName, id: methodId, events: []};
  method.events.push({type: 'start', at: startTime});
  method.events.push({type: 'error', at: startTime + methodDelay, data: {error: errorMessage}});
  method = Kadira.tracer.buildTrace(method);
  model.processMethod(method);
}


function Pick (doc, fields) {
  var newDoc = {};
  fields.forEach(function(field) {
    newDoc[field] = doc[field];
  });
  return newDoc;
}
