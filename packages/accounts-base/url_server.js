// XXX These should probably not actually be public?

AccountsServer.prototype.urls = {
  resetPassword: function (token) {
    return Meteor.absoluteUrl('#/reset-password/' + token);
  },

  verifyEmail: function (token) {
    return Meteor.absoluteUrl('#/verify-email/' + token);
  },

  enrollAccount: function (token) {
    return Meteor.absoluteUrl('#/enroll-account/' + token);
  }
};
