wrapOplogObserveDriver = function(proto) {
  // Track the polled documents. This is reflect to the RAM size and
  // for the CPU usage directly
  var originalPublishNewResults = proto._publishNewResults;
  proto._publishNewResults = function(newResults, newBuffer) {
    var coll = this._cursorDescription.collectionName;
    var query = this._cursorDescription.selector;
    var opts = this._cursorDescription.options;
    var docSize = Kadira.docSzCache.getSize(coll, query, opts, newResults);
    var docSize = Kadira.docSzCache.getSize(coll, query, opts, newBuffer);
    var count = newResults.size() + newBuffer.size();
    if(this._ownerInfo) {
      Kadira.models.pubsub.trackPolledDocuments(this._ownerInfo, count);
      Kadira.models.pubsub.trackDocSize(this._ownerInfo.name, "polledFetches", docSize*count);
    } else {
      this._polledDocuments = count;
      this._docSize = {
        polledFetches: docSize*count
      }
    }
    return originalPublishNewResults.call(this, newResults, newBuffer);
  };

  var originalHandleOplogEntryQuerying = proto._handleOplogEntryQuerying;
  proto._handleOplogEntryQuerying = function(op) {
    Kadira.models.pubsub.trackDocumentChanges(this._ownerInfo, op);
    return originalHandleOplogEntryQuerying.call(this, op);
  };

  var originalHandleOplogEntrySteadyOrFetching = proto._handleOplogEntrySteadyOrFetching;
  proto._handleOplogEntrySteadyOrFetching = function(op) {
    Kadira.models.pubsub.trackDocumentChanges(this._ownerInfo, op);
    return originalHandleOplogEntrySteadyOrFetching.call(this, op);
  };

  // track live updates
  ['_addPublished', '_removePublished', '_changePublished'].forEach(function(fnName) {
    var originalFn = proto[fnName];
    proto[fnName] = function(a, b, c) {
      if(this._ownerInfo) {
        Kadira.models.pubsub.trackLiveUpdates(this._ownerInfo, fnName, 1);

        if(fnName === "_addPublished") {
          var coll = this._cursorDescription.collectionName;
          var query = this._cursorDescription.selector;
          var opts = this._cursorDescription.options;
          var docSize = Kadira.docSzCache.getSize(coll, query, opts, [b]);

          Kadira.models.pubsub.trackDocSize(this._ownerInfo.name, "liveFetches", docSize);
        }
      } else {
        // If there is no ownerInfo, that means this is the initial adds
        if(!this._liveUpdatesCounts) {
          this._liveUpdatesCounts = {
            _initialAdds: 0
          };
        }

        this._liveUpdatesCounts._initialAdds++;

        if(fnName === "_addPublished") {
          if(!this._docSize) {
            this._docSize = {
              initialFetches: 0
            };
          }

          if(!this._docSize.initialFetches) {
            this._docSize.initialFetches = 0;
          }

          var coll = this._cursorDescription.collectionName;
          var query = this._cursorDescription.selector;
          var opts = this._cursorDescription.options;
          var docSize = Kadira.docSzCache.getSize(coll, query, opts, [b]);

          this._docSize.initialFetches += docSize;
        }
      }

      return originalFn.call(this, a, b, c);
    };
  });

  var originalStop = proto.stop;
  proto.stop = function() {
    if(this._ownerInfo && this._ownerInfo.type === 'sub') {
      Kadira.EventBus.emit('pubsub', 'observerDeleted', this._ownerInfo);
      Kadira.models.pubsub.trackDeletedObserver(this._ownerInfo);
    }

    return originalStop.call(this);
  };
};

wrapPollingObserveDriver = function(proto) {
  var originalPollMongo = proto._pollMongo;
  proto._pollMongo = function() {
    var start = Date.now();
    originalPollMongo.call(this);

    // Current result is stored in the following variable.
    // So, we can use that
    // Sometimes, it's possible to get size as undefined.
    // May be something with different version. We don't need to worry about
    // this now
    var count = 0;
    var docSize = 0;

    if(this._results && this._results.size) {
      count = this._results.size() || 0;

      var coll = this._cursorDescription.collectionName;
      var query = this._cursorDescription.selector;
      var opts = this._cursorDescription.options;

      docSize = Kadira.docSzCache.getSize(coll, query, opts, this._results._map)*count;
    }

    if(this._ownerInfo) {
      Kadira.models.pubsub.trackPolledDocuments(this._ownerInfo, count);
      Kadira.models.pubsub.trackDocSize(this._ownerInfo.name, "polledFetches", docSize);
    } else {
      this._polledDocuments = count;
      this._polledDocSize = docSize;
    }
  };

  var originalStop = proto.stop;
  proto.stop = function() {
    if(this._ownerInfo && this._ownerInfo.type === 'sub') {
      Kadira.EventBus.emit('pubsub', 'observerDeleted', this._ownerInfo);
      Kadira.models.pubsub.trackDeletedObserver(this._ownerInfo);
    }

    return originalStop.call(this);
  };
};

wrapMultiplexer = function(proto) {
  var originalInitalAdd = proto.addHandleAndSendInitialAdds;
   proto.addHandleAndSendInitialAdds = function(handle) {
    if(!this._firstInitialAddTime) {
      this._firstInitialAddTime = Date.now();
    }

    handle._wasMultiplexerReady = this._ready();
    handle._queueLength = this._queue._taskHandles.length;

    if(!handle._wasMultiplexerReady) {
      handle._elapsedPollingTime = Date.now() - this._firstInitialAddTime;
    }
    return originalInitalAdd.call(this, handle);
  };
};

wrapForCountingObservers = function() {
  // to count observers
  var mongoConnectionProto = MeteorX.MongoConnection.prototype;
  var originalObserveChanges = mongoConnectionProto._observeChanges;
  mongoConnectionProto._observeChanges = function(cursorDescription, ordered, callbacks) {
    var ret = originalObserveChanges.call(this, cursorDescription, ordered, callbacks);
    // get the Kadira Info via the Meteor.EnvironmentalVariable
    var kadiraInfo = Kadira._getInfo(null, true);

    if(kadiraInfo && ret._multiplexer) {
      if(!ret._multiplexer.__kadiraTracked) {
        // new multiplexer
        ret._multiplexer.__kadiraTracked = true;
        Kadira.EventBus.emit('pubsub', 'newSubHandleCreated', kadiraInfo.trace);
        Kadira.models.pubsub.incrementHandleCount(kadiraInfo.trace, false);
        if(kadiraInfo.trace.type == 'sub') {
          var ownerInfo = {
            type: kadiraInfo.trace.type,
            name: kadiraInfo.trace.name,
            startTime: (new Date()).getTime()
          };

          var observerDriver = ret._multiplexer._observeDriver;
          observerDriver._ownerInfo = ownerInfo;
          Kadira.EventBus.emit('pubsub', 'observerCreated', ownerInfo);
          Kadira.models.pubsub.trackCreatedObserver(ownerInfo);

          // We need to send initially polled documents if there are
          if(observerDriver._polledDocuments) {
            Kadira.models.pubsub.trackPolledDocuments(ownerInfo, observerDriver._polledDocuments);
            observerDriver._polledDocuments = 0;
          }

          // We need to send initially polled documents if there are
          if(observerDriver._polledDocSize) {
            Kadira.models.pubsub.trackDocSize(ownerInfo.name, "polledFetches", observerDriver._polledDocSize);
            observerDriver._polledDocSize = 0;
          }

          // Process _liveUpdatesCounts
          _.each(observerDriver._liveUpdatesCounts, function(count, key) {
            Kadira.models.pubsub.trackLiveUpdates(ownerInfo, key, count);
          });

          // Process docSize
          _.each(observerDriver._docSize, function(count, key) {
            Kadira.models.pubsub.trackDocSize(ownerInfo.name, key, count);
          });
        }
      } else {
        Kadira.EventBus.emit('pubsub', 'cachedSubHandleCreated', kadiraInfo.trace);
        Kadira.models.pubsub.incrementHandleCount(kadiraInfo.trace, true);
      }
    }

    return ret;
  }
};