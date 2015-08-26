// for convenience
var loginButtonsSession = Accounts._loginButtonsSession;

// since we don't want to pass around the callback that we get from our event
// handlers, we just make it a variable for the whole file
var doneCallback;

Accounts.onResetPasswordLink(function (token, done) {
  loginButtonsSession.set("resetPasswordToken", token);
  doneCallback = done;
});

Accounts.onEnrollmentLink(function (token, done) {
  loginButtonsSession.set("enrollAccountToken", token);
  doneCallback = done;
});

Accounts.onEmailVerificationLink(function (token, done) {
  Accounts.verifyEmail(token, function (error) {
    if (! error) {
      loginButtonsSession.set('justVerifiedEmail', true);
    }

    done();
    // XXX show something if there was an error.
  });
});


//
// resetPasswordDialog template
//

Template._resetPasswordDialog.events({
  'click #login-buttons-reset-password-button': function () {
    resetPassword();
  },
  'keypress #reset-password-new-password': function (event) {
    if (event.keyCode === 13)
      resetPassword();
  },
  'click #login-buttons-cancel-reset-password': function () {
    loginButtonsSession.set('resetPasswordToken', null);
    if (doneCallback)
      doneCallback();
  }
});

var resetPassword = function () {
  loginButtonsSession.resetMessages();
  var newPassword = document.getElementById('reset-password-new-password').value;
  if (!validatePassword(newPassword))
    return;

  Accounts.resetPassword(
    loginButtonsSession.get('resetPasswordToken'), newPassword,
    function (error) {
      if (error) {
        loginButtonsSession.errorMessage(error.reason || "Unknown error");
      } else {
        loginButtonsSession.set('resetPasswordToken', null);
        loginButtonsSession.set('justResetPassword', true);
        if (doneCallback)
          doneCallback();
      }
    });
};

Template._resetPasswordDialog.helpers({
  inResetPasswordFlow: function () {
    return loginButtonsSession.get('resetPasswordToken');
  }
});

//
// justResetPasswordDialog template
//

Template._justResetPasswordDialog.events({
  'click #just-verified-dismiss-button': function () {
    loginButtonsSession.set('justResetPassword', false);
  }
});

Template._justResetPasswordDialog.helpers({
  visible: function () {
    return loginButtonsSession.get('justResetPassword');
  },
  displayName: displayName
});



//
// enrollAccountDialog template
//

Template._enrollAccountDialog.events({
  'click #login-buttons-enroll-account-button': function () {
    enrollAccount();
  },
  'keypress #enroll-account-password': function (event) {
    if (event.keyCode === 13)
      enrollAccount();
  },
  'click #login-buttons-cancel-enroll-account': function () {
    loginButtonsSession.set('enrollAccountToken', null);
    if (doneCallback)
      doneCallback();
  }
});

var enrollAccount = function () {
  loginButtonsSession.resetMessages();
  var password = document.getElementById('enroll-account-password').value;
  if (!validatePassword(password))
    return;

  Accounts.resetPassword(
    loginButtonsSession.get('enrollAccountToken'), password,
    function (error) {
      if (error) {
        loginButtonsSession.errorMessage(error.reason || "Unknown error");
      } else {
        loginButtonsSession.set('enrollAccountToken', null);
        if (doneCallback)
          doneCallback();
      }
    });
};

Template._enrollAccountDialog.helpers({
  inEnrollAccountFlow: function () {
    return loginButtonsSession.get('enrollAccountToken');
  }
});


//
// justVerifiedEmailDialog template
//

Template._justVerifiedEmailDialog.events({
  'click #just-verified-dismiss-button': function () {
    loginButtonsSession.set('justVerifiedEmail', false);
  }
});

Template._justVerifiedEmailDialog.helpers({
  visible: function () {
    return loginButtonsSession.get('justVerifiedEmail');
  },
  displayName: displayName
});


//
// loginButtonsMessagesDialog template
//

Template._loginButtonsMessagesDialog.events({
  'click #messages-dialog-dismiss-button': function () {
    loginButtonsSession.resetMessages();
  }
});

Template._loginButtonsMessagesDialog.helpers({
  visible: function () {
    var hasMessage = loginButtonsSession.get('infoMessage') || loginButtonsSession.get('errorMessage');
    return !dropdown() && hasMessage;
  }
});


//
// configureLoginServiceDialog template
//

Template._configureLoginServiceDialog.events({
  'click .configure-login-service-dismiss-button': function () {
    loginButtonsSession.set('configureLoginServiceDialogVisible', false);
  },
  'click #configure-login-service-dialog-save-configuration': function () {
    if (loginButtonsSession.get('configureLoginServiceDialogVisible') &&
        ! loginButtonsSession.get('configureLoginServiceDialogSaveDisabled')) {
      // Prepare the configuration document for this login service
      var serviceName = loginButtonsSession.get('configureLoginServiceDialogServiceName');
      var configuration = {
        service: serviceName
      };

      // Fetch the value of each input field
      _.each(configurationFields(), function(field) {
        configuration[field.property] = document.getElementById(
          'configure-login-service-dialog-' + field.property).value
          .replace(/^\s*|\s*$/g, ""); // trim() doesnt work on IE8;
      });

      configuration.loginStyle =
        $('#configure-login-service-dialog input[name="loginStyle"]:checked')
        .val();

      // Configure this login service
      Accounts.connection.call(
        "configureLoginService", configuration, function (error, result) {
          if (error)
            Meteor._debug("Error configuring login service " + serviceName,
                          error);
          else
            loginButtonsSession.set('configureLoginServiceDialogVisible',
                                    false);
        });
    }
  },
  // IE8 doesn't support the 'input' event, so we'll run this on the keyup as
  // well. (Keeping the 'input' event means that this also fires when you use
  // the mouse to change the contents of the field, eg 'Cut' menu item.)
  'input, keyup input': function (event) {
    // if the event fired on one of the configuration input fields,
    // check whether we should enable the 'save configuration' button
    if (event.target.id.indexOf('configure-login-service-dialog') === 0)
      updateSaveDisabled();
  }
});

// check whether the 'save configuration' button should be enabled.
// this is a really strange way to implement this and a Forms
// Abstraction would make all of this reactive, and simpler.
var updateSaveDisabled = function () {
  var anyFieldEmpty = _.any(configurationFields(), function(field) {
    return document.getElementById(
      'configure-login-service-dialog-' + field.property).value === '';
  });

  loginButtonsSession.set('configureLoginServiceDialogSaveDisabled', anyFieldEmpty);
};

// Returns the appropriate template for this login service.  This
// template should be defined in the service's package
var configureLoginServiceDialogTemplateForService = function () {
  var serviceName = loginButtonsSession.get('configureLoginServiceDialogServiceName');
  // XXX Service providers should be able to specify their configuration
  // template name.
  return Template['configureLoginServiceDialogFor' +
                  (serviceName === 'meteor-developer' ?
                   'MeteorDeveloper' :
                   capitalize(serviceName))];
};

var configurationFields = function () {
  var template = configureLoginServiceDialogTemplateForService();
  return template.fields();
};

Template._configureLoginServiceDialog.helpers({
  configurationFields: function () {
    return configurationFields();
  },
  visible: function () {
    return loginButtonsSession.get('configureLoginServiceDialogVisible');
  },
  configurationSteps: function () {
    // renders the appropriate template
    return configureLoginServiceDialogTemplateForService();
  },
  saveDisabled: function () {
    return loginButtonsSession.get('configureLoginServiceDialogSaveDisabled');
  }
});

// XXX from http://epeli.github.com/underscore.string/lib/underscore.string.js
var capitalize = function(str){
  str = str == null ? '' : String(str);
  return str.charAt(0).toUpperCase() + str.slice(1);
};

Template._configureLoginOnDesktopDialog.helpers({
  visible: function () {
    return loginButtonsSession.get('configureOnDesktopVisible');
  }
});

Template._configureLoginOnDesktopDialog.events({
  'click #configure-on-desktop-dismiss-button': function () {
    loginButtonsSession.set('configureOnDesktopVisible', false);
  }
});
