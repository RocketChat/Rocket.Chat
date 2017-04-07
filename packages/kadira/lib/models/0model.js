KadiraModel = function() {

};

KadiraModel.prototype._getDateId = function(timestamp) {
  var remainder = timestamp % (1000 * 60);
  var dateId = timestamp - remainder;
  return dateId;
};