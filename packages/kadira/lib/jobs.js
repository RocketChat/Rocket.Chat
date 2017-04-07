var Jobs = Kadira.Jobs = {};

Jobs.getAsync = function(id, callback) {
  Kadira.coreApi.getJob(id)
    .then(function(data) {
      callback(null, data);
    })
    .catch(function(err) {
      callback(err)
    });
};


Jobs.setAsync = function(id, changes, callback) {
  Kadira.coreApi.updateJob(id, changes)
    .then(function(data) {
      callback(null, data);
    })
    .catch(function(err) {
      callback(err)
    });
};

Jobs.set = Kadira._wrapAsync(Jobs.setAsync);
Jobs.get = Kadira._wrapAsync(Jobs.getAsync);
