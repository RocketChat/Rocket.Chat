var commonErrRegExps = [
  /connection timeout\. no (\w*) heartbeat received/i,
  /INVALID_STATE_ERR/i,
];

Kadira.errorFilters = {
  filterValidationErrors: function(type, message, err) {
    if(err && err instanceof Meteor.Error) {
      return false;
    } else {
      return true;
    }
  },

  filterCommonMeteorErrors: function(type, message) {
    for(var lc=0; lc<commonErrRegExps.length; lc++) {
      var regExp = commonErrRegExps[lc];
      if(regExp.test(message)) {
        return false;
      }
    }
    return true;
  }
};