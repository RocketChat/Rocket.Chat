// strip sensitive data sent to kadia engine.
// possible to limit types by providing an array of types to strip
// possible types are: "start", "db", "http", "email"
Tracer.stripSensitive = function stripSensitive(typesToStrip, receiverType, name) {
  typesToStrip =  typesToStrip || [];

  var strippedTypes = {};
  typesToStrip.forEach(function(type) {
    strippedTypes[type] = true;
  });

  return function (type, data, info) {
    if(typesToStrip.length > 0 && !strippedTypes[type])
      return data;

    if(receiverType && receiverType != info.type)
      return data;

    if(name && name != info.name)
      return data;

    if(type == "start") {
      data.params = "[stripped]";
    } else if(type == "db") {
      data.selector = "[stripped]";
    } else if(type == "http") {
      data.url = "[stripped]";
    } else if(type == "email") {
      ["from", "to", "cc", "bcc", "replyTo"].forEach(function(item) {
        if(data[item]) {
          data[item] = "[stripped]";
        }
      });
    }

    return data;
  };
};

// strip selectors only from the given list of collection names
Tracer.stripSelectors = function stripSelectors(collectionList, receiverType, name) {
  collectionList = collectionList || [];

  var collMap = {};
  collectionList.forEach(function(collName) {
    collMap[collName] = true;
  });

  return function(type, data, info) {
    if(type != "db" || (data && !collMap[data.coll])) {
      return data
    }

    if(receiverType && receiverType != info.type)
      return data;

    if(name && name != info.name)
      return data;

    data.selector = "[stripped]";
    return data;
  };
}