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
