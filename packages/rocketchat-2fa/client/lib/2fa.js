import toastr from 'toastr';
import s from 'underscore.string';

this.reportError = function(error, callback) {
  if (callback) {
    callback(error);
  } else {
    throw error;
  }
};

this.convertError = function(err) {
  if (err && err instanceof Meteor.Error &&
      err.error === Accounts.LoginCancelledError.numericError)
    return new Accounts.LoginCancelledError(err.reason);
  else
    return err;
};

this.overrideLoginMethod = function(loginMethod, loginArgs, cb, loginMethodTOTP) {
  loginMethod.apply(this, loginArgs.concat([(error) => {
    if (!error || error.error !== 'totp-required') {
      return cb(error);
    }

    modal.open({
      title: t('Two-factor_authentication'),
      text: t('Open_your_authentication_app_and_enter_the_code'),
      type: 'input',
      inputType: 'text',
      showCancelButton: true,
      closeOnConfirm: true,
      confirmButtonText: t('Verify'),
      cancelButtonText: t('Cancel')
    }, (code) => {
      if (code === false) {
        return cb();
      }

      loginMethodTOTP && loginMethodTOTP.apply(this, loginArgs.concat([code, (error) => {
        if (error && error.error === 'totp-invalid') {
          toastr.error(t('Invalid_two_factor_code'));
          cb();
        } else {
          cb(error);
        }
      }]));
    });    
  }]));
};

this.createOAuthTotpLoginMethod = function(credentialProvider) {
  return function(options, code, callback) {
    // support a callback without options
    if (!callback && typeof options === "function") {
      callback = options;
      options = null;
    }

    const provider = credentialProvider();

    const credentialRequestCompleteCallback = Accounts.oauth.credentialRequestCompleteHandler(callback, code);
    provider.requestCredential(options, credentialRequestCompleteCallback);
  };
};

const oldConfigureLogin = CustomOAuth.prototype.configureLogin;
CustomOAuth.prototype.configureLogin = function() {
  const loginWithService = `loginWith${ s.capitalize(this.name) }`;

  oldConfigureLogin.apply(this, arguments);

  const oldMethod = Meteor[loginWithService];
  const newMethod = (options, code, callback) => {
    // support a callback without options
    if (!callback && typeof options === 'function') {
      callback = options;
      options = null;
    }

    const credentialRequestCompleteCallback = Accounts.oauth.credentialRequestCompleteHandler(callback, code);
    this.requestCredential(options, credentialRequestCompleteCallback);
  };

  Meteor[loginWithService] = function(options, cb) {
    overrideLoginMethod(oldMethod, [options], cb, newMethod)
  }
};