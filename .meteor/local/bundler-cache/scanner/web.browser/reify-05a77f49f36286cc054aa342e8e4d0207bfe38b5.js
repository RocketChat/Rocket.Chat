exports.makeCompatible = function (Promise) {
  var es6PromiseThen = Promise.prototype.then;

  Promise.prototype.then = function (onResolved, onRejected) {
    if (typeof Meteor === "object" &&
        typeof Meteor.bindEnvironment === "function") {
      return es6PromiseThen.call(
        this,
        onResolved && Meteor.bindEnvironment(onResolved, raise),
        onRejected && Meteor.bindEnvironment(onRejected, raise)
      );
    }

    return es6PromiseThen.call(this, onResolved, onRejected);
  };
};

function raise(exception) {
  throw exception;
}
