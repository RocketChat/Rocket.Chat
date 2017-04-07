var logger = Npm.require('debug')('kadira:ts');

TracerStore = function TracerStore(options) {
  options = options || {};

  this.maxTotalPoints = options.maxTotalPoints || 30;
  this.interval = options.interval || 1000 * 60;
  this.archiveEvery = options.archiveEvery || this.maxTotalPoints / 6;

  //store max total on the past 30 minutes (or past 30 items)
  this.maxTotals = {};
  //store the max trace of the current interval
  this.currentMaxTrace = {};
  //archive for the traces
  this.traceArchive = [];

  this.processedCnt = {};

  //group errors by messages between an interval
  this.errorMap = {};
};

TracerStore.prototype.addTrace = function(trace) {
  var kind = [trace.type, trace.name].join('::');
  if(!this.currentMaxTrace[kind]) {
    this.currentMaxTrace[kind] = EJSON.clone(trace);
  } else if(this.currentMaxTrace[kind].metrics.total < trace.metrics.total) {
    this.currentMaxTrace[kind] = EJSON.clone(trace);
  } else if(trace.errored) {
    this._handleErrors(trace);
  }
};

TracerStore.prototype.collectTraces = function() {
  var traces = this.traceArchive;
  this.traceArchive = [];

  // convert at(timestamp) into the actual serverTime
  traces.forEach(function(trace) {
    trace.at = Kadira.syncedDate.syncTime(trace.at);
  });
  return traces;
};

TracerStore.prototype.start = function() {
  this._timeoutHandler = setInterval(this.processTraces.bind(this), this.interval);
};

TracerStore.prototype.stop = function() {
  if(this._timeoutHandler) {
    clearInterval(this._timeoutHandler);
  }
};

TracerStore.prototype._handleErrors = function(trace) {
  // sending error requests as it is
  var lastEvent = trace.events[trace.events.length -1];
  if(lastEvent && lastEvent[2]) {
    var error = lastEvent[2].error;

    // grouping errors occured (reset after processTraces)
    var errorKey = [trace.type, trace.name, error.message].join("::");
    if(!this.errorMap[errorKey]) {
      var erroredTrace = EJSON.clone(trace);
      this.errorMap[errorKey] = erroredTrace;

      this.traceArchive.push(erroredTrace);
    }
  } else {
    logger('last events is not an error: ', JSON.stringify(trace.events));
  }
};

TracerStore.prototype.processTraces = function() {
  var self = this;
  var kinds = _.union(
    _.keys(this.maxTotals),
    _.keys(this.currentMaxTrace)
  );

  kinds.forEach(function(kind) {
    self.processedCnt[kind] = self.processedCnt[kind] || 0;
    var currentMaxTrace = self.currentMaxTrace[kind];
    var currentMaxTotal = currentMaxTrace? currentMaxTrace.metrics.total : 0;

    self.maxTotals[kind] = self.maxTotals[kind] || [];
    //add the current maxPoint
    self.maxTotals[kind].push(currentMaxTotal);
    var exceedingPoints = self.maxTotals[kind].length - self.maxTotalPoints;
    if(exceedingPoints > 0) {
      self.maxTotals[kind].splice(0, exceedingPoints);
    }

    var archiveDefault = (self.processedCnt[kind] % self.archiveEvery) == 0;
    self.processedCnt[kind]++;

    var canArchive = archiveDefault
      || self._isTraceOutlier(kind, currentMaxTrace);

    if(canArchive && currentMaxTrace) {
      self.traceArchive.push(currentMaxTrace);
    }

    //reset currentMaxTrace
    self.currentMaxTrace[kind] = null;
  });

  //reset the errorMap
  self.errorMap = {};
};

TracerStore.prototype._isTraceOutlier = function(kind, trace) {
  if(trace) {
    var dataSet = this.maxTotals[kind];
    return this._isOutlier(dataSet, trace.metrics.total, 3);
  } else {
    return false;
  }
};

/*
  Data point must exists in the dataSet
*/
TracerStore.prototype._isOutlier = function(dataSet, dataPoint, maxMadZ) {
  var median = this._getMedian(dataSet);
  var mad = this._calculateMad(dataSet, median);
  var madZ = this._funcMedianDeviation(median)(dataPoint) / mad;

  return madZ > maxMadZ;
};

TracerStore.prototype._getMedian = function(dataSet) {
  var sortedDataSet = _.clone(dataSet).sort(function(a, b) {
    return a-b;
  });
  return this._pickQuartile(sortedDataSet, 2);
};

TracerStore.prototype._pickQuartile = function(dataSet, num) {
  var pos = ((dataSet.length + 1) * num) / 4;
  if(pos % 1 == 0) {
    return dataSet[pos -1];
  } else {
    pos = pos - (pos % 1);
    return (dataSet[pos -1] + dataSet[pos])/2
  }
};

TracerStore.prototype._calculateMad = function(dataSet, median) {
  var medianDeviations = _.map(dataSet, this._funcMedianDeviation(median));
  var mad = this._getMedian(medianDeviations);

  return mad;
};

TracerStore.prototype._funcMedianDeviation = function(median) {
  return function(x) {
    return Math.abs(median - x);
  };
};

TracerStore.prototype._getMean = function(dataPoints) {
  if(dataPoints.length > 0) {
    var total = 0;
    dataPoints.forEach(function(point) {
      total += point;
    });
    return total/dataPoints.length;
  } else {
    return 0;
  }
};
