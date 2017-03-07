/**
 * Created by OliverJaegle on 01.08.2016.
 */
// var _ = Npm.require('underscore');

_.extend(RocketChat.models.LivechatExternalMessage, {
	findOneById: function (_id, options) {
		const query = { '_id': _id };
		return this.findOne(query, options)
	}
});
