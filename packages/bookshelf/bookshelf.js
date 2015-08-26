if (Meteor.isServer) {
  Bookshelf = Npm.require('bookshelf');
} else {
  Bookshelf = BrowserifyBookshelf;
}

// Fix incompatibilities of lodash and underscore here
// Pretty hacky, but if we don't want to load another copy of '_', we
// need to keep them in sort of sync
const origSome = _.some;
_.some = function (list, predicate, context) {
  if (typeof predicate === 'function')
    return origSome.call(this, list, predicate, context);
  if (typeof predicate === 'string')
    return origSome(list, function (x) {
      return !!Meteor._get(x, ...predicate.split('.'));
    }, context);
  return !!_.findWhere(list, predicate, context);
};
