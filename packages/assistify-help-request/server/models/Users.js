/**
 * Created by OliverJaegle on 01.08.2016.
 * Expose features of the users-collection which are not exposed by default
 */
// var _ = Npm.require('underscore');

RocketChat.models.Users.findByEmailAddresses = function(emailAddresses, options) {
	const query = {'emails.address': {$in: emailAddresses.map((emailAddress) => new RegExp(`^${ s.escapeRegExp(emailAddress) }$`, 'i'))}};

	return this.find(query, options);
};

RocketChat.models.Users.findByIds = function(ids, options) {
	const query = {'_id': {$in: ids}};
	return this.find(query, options);
};
