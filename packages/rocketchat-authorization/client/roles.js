"use strict"


////////////////////////////////////////////////////////////
// Debugging helpers
//
// Run this in your browser console to turn on debugging
// for this package:
//
//   localstorage.setItem('Roles.debug', true)
//

Roles.debug = false

if (localStorage) {
  var temp = localStorage.getItem("Roles.debug")

  if ('undefined' !== typeof temp) {
    Roles.debug = !!temp
  }
}

/**
 * Convenience functions for use on client.
 *
 * NOTE: You must restrict user actions on the server-side; any
 * client-side checks are strictly for convenience and must not be
 * trusted.
 *
 * @module UIHelpers
 */


////////////////////////////////////////////////////////////
// UI helpers
//
// Use a semi-private variable rather than declaring UI
// helpers directly so that we can unit test the helpers.
// XXX For some reason, the UI helpers are not registered
// before the tests run.
//
Roles._uiHelpers = {

  /**
   * UI helper to check if current user is in at least one
   * of the target roles.  For use in client-side templates.
   *
   * @example
   *     {{#if isInRole 'admin'}}
   *     {{/if}}
   *
   *     {{#if isInRole 'editor,user'}}
   *     {{/if}}
   *
   *     {{#if isInRole 'editor,user' 'group1'}}
   *     {{/if}}
   *
   * @method isInRole
   * @param {String} role Name of role or comma-seperated list of roles
   * @param {String} [group] Optional, name of group to check
   * @return {Boolean} true if current user is in at least one of the target roles
   * @static
   * @for UIHelpers
   */
  isInRole: function (role, group) {
    var user = Meteor.user(),
        comma = (role || '').indexOf(','),
        roles

    if (!user) return false
    if (!Match.test(role, String)) return false

    if (comma !== -1) {
      roles = _.reduce(role.split(','), function (memo, r) {
        if (!r || !r.trim()) {
          return memo
        }
        memo.push(r.trim())
        return memo
      }, [])
    } else {
      roles = [role]
    }

    if (Match.test(group, String)) {
      return Roles.userIsInRole(user, roles, group)
    }

    return Roles.userIsInRole(user, roles)
  }
}



////////////////////////////////////////////////////////////
// Register UI helpers
//

if (Roles.debug && console.log) {
  console.log("[roles] Roles.debug =", Roles.debug)
}

if ('undefined' !== typeof Package.blaze &&
    'undefined' !== typeof Package.blaze.Blaze &&
    'function'  === typeof Package.blaze.Blaze.registerHelper) {
  _.each(Roles._uiHelpers, function (func, name) {
    if (Roles.debug && console.log) {
      console.log("[roles] registering Blaze helper '" + name + "'")
    }
    Package.blaze.Blaze.registerHelper(name, func)
  })
}

/**
 * Subscription handle for the currently logged in user's permissions.
 *
 * NOTE: The corresponding publish function, `_roles`, depends on
 * `this.userId` so it will automatically re-run when the currently
 * logged-in user changes.
 *
 * @example
 *
 *     `Roles.subscription.ready()` // => `true` if user roles have been loaded
 *
 * @property subscription
 * @type Object
 * @for Roles
 */

Tracker.autorun(function () {
  Roles.subscription = Meteor.subscribe("_roles")
})
