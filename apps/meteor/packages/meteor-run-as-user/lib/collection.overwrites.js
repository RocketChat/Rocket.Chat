// TODO: Remove this after meteor fixes the issue
// This override fixes a recent issue introduced after the update to Meteor 3.0
// MinimongoCollection.remove(query) where `query` has `_id: { $in: Array }` removes only the first found record.
LocalCollection.prototype['_eachPossiblyMatchingDocAsync'] =  async function (selector, fn) {
    const specificIds = LocalCollection._idsMatchedBySelector(selector);

    if (specificIds) {
      for (const id of specificIds) {
        const doc = this._docs.get(id);

        if (doc && (await fn(doc, id)) === false) { // Changed from `!fn(doc,id)`
          break
        }
      }
    } else {
      await this._docs.forEachAsync(fn);
    }
  }

  LocalCollection.prototype['_eachPossiblyMatchingDocSync'] = function (selector, fn) {
    const specificIds = LocalCollection._idsMatchedBySelector(selector);

    if (specificIds) {
      for (const id of specificIds) {
        const doc = this._docs.get(id);

        if (doc && fn(doc, id) === false) { // Changed from `!fn(doc,id)`
          break
        }
      }
    } else {
      this._docs.forEach(fn);
    }
  }

// This file overwrites the default metoer Mongo.Collection modifiers: "insert",
// "update", "remove"
//
// The new methods are checking if Meteor is in "restricted" mode to apply
// allow and deny rules if needed.
//
// This will allow us to run the modifiers inside of a "Meteor.runAsUser" with
// security checks.
_.each(['insert', 'update', 'remove'], function (method) {
	var _super = Mongo.Collection.prototype[method];

	Mongo.Collection.prototype[method] = function (/* arguments */) {
		var self = this;
		var args = _.toArray(arguments);

		// Check if this method is run in restricted mode and collection is
		// restricted.
		if (Meteor.isRestricted() && self._restricted) {
			var generatedId = null;
			if (method === 'insert' && !_.has(args[0], '_id')) {
				generatedId = self._makeNewID();
			}

			// short circuit if there is no way it will pass.
			if (self._validators[method].allow.length === 0) {
				throw new Meteor.Error(403, 'Access denied. No allow validators set on restricted ' + "collection for method '" + method + "'.");
			}

			var validatedMethodName = '_validated' + method.charAt(0).toUpperCase() + method.slice(1);
			args.unshift(Meteor.userId());

			if (method === 'insert') {
				args.push(generatedId);

				self[validatedMethodName].apply(self, args);
				// xxx: for now we return the id since self._validatedInsert doesn't
				// yet return the new id
				return generatedId || args[0]._id;
			}

			return self[validatedMethodName].apply(self, args);
		}

		return _super.apply(self, args);
	};
});


