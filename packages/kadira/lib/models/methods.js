var METHOD_METRICS_FIELDS = ['wait', 'db', 'http', 'email', 'async', 'compute', 'total'];

MethodsModel = function (metricsThreshold) {
  var self = this;

  this.methodMetricsByMinute = {};
  this.errorMap = {};

  this._metricsThreshold = _.extend({
    "wait": 100,
    "db": 100,
    "http": 1000,
    "email": 100,
    "async": 100,
    "compute": 100,
    "total": 200
  }, metricsThreshold || {});

  //store max time elapsed methods for each method, event(metrics-field)
  this.maxEventTimesForMethods = {};

  this.tracerStore = new TracerStore({
    interval: 1000 * 60, //process traces every minute
    maxTotalPoints: 30, //for 30 minutes
    archiveEvery: 5 //always trace for every 5 minutes,
  });

  this.tracerStore.start();
};

_.extend(MethodsModel.prototype, KadiraModel.prototype);

MethodsModel.prototype._getMetrics = function(timestamp, method) {
  var dateId = this._getDateId(timestamp);

  if(!this.methodMetricsByMinute[dateId]) {
    this.methodMetricsByMinute[dateId] = {
      methods: {}
    };
  }

  var methods = this.methodMetricsByMinute[dateId].methods;

  //initialize method
  if(!methods[method]) {
    methods[method] = {
      count: 0,
      errors: 0,
      fetchedDocSize: 0,
      sentMsgSize: 0
    };

    METHOD_METRICS_FIELDS.forEach(function(field) {
      methods[method][field] = 0;
    });
  }

  return this.methodMetricsByMinute[dateId].methods[method];
};

MethodsModel.prototype.setStartTime = function(timestamp) {
  this.metricsByMinute[dateId].startTime = timestamp;
}

MethodsModel.prototype.processMethod = function(methodTrace) {
  var dateId = this._getDateId(methodTrace.at);

  //append metrics to previous values
  this._appendMetrics(dateId, methodTrace);
  if(methodTrace.errored) {
    this.methodMetricsByMinute[dateId].methods[methodTrace.name].errors ++
  }

  this.tracerStore.addTrace(methodTrace);
};

MethodsModel.prototype._appendMetrics = function(id, methodTrace) {
  var methodMetrics = this._getMetrics(id, methodTrace.name)

  // startTime needs to be converted into serverTime before sending
  if(!this.methodMetricsByMinute[id].startTime){
    this.methodMetricsByMinute[id].startTime = methodTrace.at;
  }

  //merge
  METHOD_METRICS_FIELDS.forEach(function(field) {
    var value = methodTrace.metrics[field];
    if(value > 0) {
      methodMetrics[field] += value;
    }
  });

  methodMetrics.count++;
  this.methodMetricsByMinute[id].endTime = methodTrace.metrics.at;
};

MethodsModel.prototype.trackDocSize = function(method, size) {
  var timestamp = Ntp._now();
  var dateId = this._getDateId(timestamp);

  var methodMetrics = this._getMetrics(dateId, method);
  methodMetrics.fetchedDocSize += size;
}

MethodsModel.prototype.trackMsgSize = function(method, size) {
  var timestamp = Ntp._now();
  var dateId = this._getDateId(timestamp);

  var methodMetrics = this._getMetrics(dateId, method);
  methodMetrics.sentMsgSize += size;
}

/*
  There are two types of data

  1. methodMetrics - metrics about the methods (for every 10 secs)
  2. methodRequests - raw method request. normally max, min for every 1 min and errors always
*/
MethodsModel.prototype.buildPayload = function(buildDetailedInfo) {
  var payload = {
    methodMetrics: [],
    methodRequests: []
  };

  //handling metrics
  var methodMetricsByMinute = this.methodMetricsByMinute;
  this.methodMetricsByMinute = {};

  //create final paylod for methodMetrics
  for(var key in methodMetricsByMinute) {
    var methodMetrics = methodMetricsByMinute[key];
    // converting startTime into the actual serverTime
    var startTime = methodMetrics.startTime;
    methodMetrics.startTime = Kadira.syncedDate.syncTime(startTime);

    for(var methodName in methodMetrics.methods) {
      METHOD_METRICS_FIELDS.forEach(function(field) {
        methodMetrics.methods[methodName][field] /=
          methodMetrics.methods[methodName].count;
      });
    }

    payload.methodMetrics.push(methodMetricsByMinute[key]);
  }

  //collect traces and send them with the payload
  payload.methodRequests = this.tracerStore.collectTraces();

  return payload;
};
