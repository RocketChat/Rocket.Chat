"use strict"


/**
 * Roles collection documents consist only of an id and a role name.
 *   ex: { _id: "123", name: "admin" }
 */
if (!Meteor.roles) {
	Meteor.roles = new Mongo.Collection("roles")

	// Create default indexes for roles collection
	Meteor.roles._ensureIndex('name', {unique: 1})
}


/**
 * Publish logged-in user's roles (global) so client-side checks can work.
 *
 * Use a named publish function so clients can check `ready()` state.
 */
Meteor.publish('scope-roles', function (scope) {
	if (!this.userId || "undefined" === typeof RocketChat.models[scope] || "function" !== typeof RocketChat.models[scope].findRolesByUserId) {
		this.ready()
		return
	}

	return RocketChat.models[scope].findRolesByUserId(this.userId);
});
