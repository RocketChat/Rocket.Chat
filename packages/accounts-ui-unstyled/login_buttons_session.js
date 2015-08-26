var VALID_KEYS = [
  'dropdownVisible',

  // XXX consider replacing these with one key that has an enum for values.
  'inSignupFlow',
  'inForgotPasswordFlow',
  'inChangePasswordFlow',
  'inMessageOnlyFlow',

  'errorMessage',
  'infoMessage',

  // dialogs with messages (info and error)
  'resetPasswordToken',
  'enrollAccountToken',
  'justVerifiedEmail',
  'justResetPassword',

  'configureLoginServiceDialogVisible',
  'configureLoginServiceDialogServiceName',
  'configureLoginServiceDialogSaveDisabled',
  'configureOnDesktopVisible'
];

var validateKey = function (key) {
  if (!_.contains(VALID_KEYS, key))
    throw new Error("Invalid key in loginButtonsSession: " + key);
};

var KEY_PREFIX = "Meteor.loginButtons.";

// XXX This should probably be package scope rather than exported
// (there was even a comment to that effect here from before we had
// namespacing) but accounts-ui-viewer uses it, so leave it as is for
// now
Accounts._loginButtonsSession = {
  set: function(key, value) {
    validateKey(key);
    if (_.contains(['errorMessage', 'infoMessage'], key))
      throw new Error("Don't set errorMessage or infoMessage directly. Instead, use errorMessage() or infoMessage().");

    this._set(key, value);
  },

  _set: function(key, value) {
    Session.set(KEY_PREFIX + key, value);
  },

  get: function(key) {
    validateKey(key);
    return Session.get(KEY_PREFIX + key);
  },

  closeDropdown: function () {
    this.set('inSignupFlow', false);
    this.set('inForgotPasswordFlow', false);
    this.set('inChangePasswordFlow', false);
    this.set('inMessageOnlyFlow', false);
    this.set('dropdownVisible', false);
    this.resetMessages();
  },

  infoMessage: function(message) {
    this._set("errorMessage", null);
    this._set("infoMessage", message);
    this.ensureMessageVisible();
  },

  errorMessage: function(message) {
    this._set("errorMessage", message);
    this._set("infoMessage", null);
    this.ensureMessageVisible();
  },

  // is there a visible dialog that shows messages (info and error)
  isMessageDialogVisible: function () {
    return this.get('resetPasswordToken') ||
      this.get('enrollAccountToken') ||
      this.get('justVerifiedEmail');
  },

  // ensure that somethings displaying a message (info or error) is
  // visible.  if a dialog with messages is open, do nothing;
  // otherwise open the dropdown.
  //
  // notably this doesn't matter when only displaying a single login
  // button since then we have an explicit message dialog
  // (_loginButtonsMessageDialog), and dropdownVisible is ignored in
  // this case.
  ensureMessageVisible: function () {
    if (!this.isMessageDialogVisible())
      this.set("dropdownVisible", true);
  },

  resetMessages: function () {
    this._set("errorMessage", null);
    this._set("infoMessage", null);
  },

  configureService: function (name) {
    if (Meteor.isCordova) {
      this.set('configureOnDesktopVisible', true);
    } else {
      this.set('configureLoginServiceDialogVisible', true);
      this.set('configureLoginServiceDialogServiceName', name);
      this.set('configureLoginServiceDialogSaveDisabled', true);
    }
  }
};
