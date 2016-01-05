"use strict"


/**
 * Roles collection documents consist only of an id and a role name.
 *   ex: { _id: "123", name: "admin" }
 */
if (!Meteor.roles) {
  Meteor.roles = new Meteor.Collection("roles")

  // Create default indexes for roles collection
  Meteor.roles._ensureIndex('name', {unique: 1})
}


/**
 * Publish logged-in user's roles so client-side checks can work.
 *
 * Use a named publish function so clients can check `ready()` state.
 */
Meteor.publish('_roles', function () {
  var loggedInUserId = this.userId,
      fields = {roles: 1}

  if (!loggedInUserId) {
    this.ready()
    return
  }

  return Meteor.users.find({_id: loggedInUserId},
                           {fields: fields})
})
