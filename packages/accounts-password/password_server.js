/// BCRYPT

var bcrypt = NpmModuleBcrypt;
var bcryptHash = Meteor.wrapAsync(bcrypt.hash);
var bcryptCompare = Meteor.wrapAsync(bcrypt.compare);

// User records have a 'services.password.bcrypt' field on them to hold
// their hashed passwords (unless they have a 'services.password.srp'
// field, in which case they will be upgraded to bcrypt the next time
// they log in).
//
// When the client sends a password to the server, it can either be a
// string (the plaintext password) or an object with keys 'digest' and
// 'algorithm' (must be "sha-256" for now). The Meteor client always sends
// password objects { digest: *, algorithm: "sha-256" }, but DDP clients
// that don't have access to SHA can just send plaintext passwords as
// strings.
//
// When the server receives a plaintext password as a string, it always
// hashes it with SHA256 before passing it into bcrypt. When the server
// receives a password as an object, it asserts that the algorithm is
// "sha-256" and then passes the digest to bcrypt.


Accounts._bcryptRounds = 10;

// Given a 'password' from the client, extract the string that we should
// bcrypt. 'password' can be one of:
//  - String (the plaintext password)
//  - Object with 'digest' and 'algorithm' keys. 'algorithm' must be "sha-256".
//
var getPasswordString = function (password) {
  if (typeof password === "string") {
    password = SHA256(password);
  } else { // 'password' is an object
    if (password.algorithm !== "sha-256") {
      throw new Error("Invalid password hash algorithm. " +
                      "Only 'sha-256' is allowed.");
    }
    password = password.digest;
  }
  return password;
};

// Use bcrypt to hash the password for storage in the database.
// `password` can be a string (in which case it will be run through
// SHA256 before bcrypt) or an object with properties `digest` and
// `algorithm` (in which case we bcrypt `password.digest`).
//
var hashPassword = function (password) {
  password = getPasswordString(password);
  return bcryptHash(password, Accounts._bcryptRounds);
};

// Check whether the provided password matches the bcrypt'ed password in
// the database user record. `password` can be a string (in which case
// it will be run through SHA256 before bcrypt) or an object with
// properties `digest` and `algorithm` (in which case we bcrypt
// `password.digest`).
//
Accounts._checkPassword = function (user, password) {
  var result = {
    userId: user._id
  };

  password = getPasswordString(password);

  if (! bcryptCompare(password, user.services.password.bcrypt)) {
    result.error = new Meteor.Error(403, "Incorrect password");
  }

  return result;
};
var checkPassword = Accounts._checkPassword;

///
/// LOGIN
///

// Attempts to find a user from a user query.
// First tries to match username or email case sensitively; if that fails, it
// tries case insensitively; but if more than one user matches the case
// insensitive search, it returns null
// @param query {Object} with one of `id`, `username`, or `email`.
// @returns A user if found, else null
var findUserFromQuery = function (query) {
  var user = null;
  if (query.id) {
    user = Meteor.users.findOne({ _id: query.id });
  } else if (query.username) {
    user = Accounts.dbClient.getUserByUsername(query.username);
  } else if (query.email) {
    user = Accounts.dbClient.getUserByEmail(query.email);
  }

  return user;
};


// Generates a MongoDB selector that can be used to perform a fast case
// insensitive lookup for the given fieldName and string. Since MongoDB does
// not support case insensitive indexes, and case insensitive regex queries
// are slow, we construct a set of prefix selectors for all permutations of
// the first 4 characters ourselves. We first attempt to matching against
// these, and because 'prefix expression' regex queries do use indexes (see
// http://docs.mongodb.org/v2.6/reference/operator/query/regex/#index-use),
// this has been found to greatly improve performance (from 1200ms to 5ms in a
// test with 1.000.000 users).
var selectorForFastCaseInsensitiveLookup = function (fieldName, string) {
  // Performance seems to improve up to 4 prefix characters
  var prefix = string.substring(0, Math.min(string.length, 4));
  var orClause = _.map(generateCasePermutationsForString(prefix),
    function (prefixPermutation) {
      var selector = {};
      selector[fieldName] =
        new RegExp('^' + Meteor._escapeRegExp(prefixPermutation));
      return selector;
    });
  var caseInsensitiveClause = {};
  caseInsensitiveClause[fieldName] =
    new RegExp('^' + Meteor._escapeRegExp(string) + '$', 'i')
  return {$and: [{$or: orClause}, caseInsensitiveClause]};
}

// Generates permutations of all case variations of a given string.
var generateCasePermutationsForString = function (string) {
  var permutations = [''];
  for (var i = 0; i < string.length; i++) {
    var ch = string.charAt(i);
    permutations = _.flatten(_.map(permutations, function (prefix) {
      var lowerCaseChar = ch.toLowerCase();
      var upperCaseChar = ch.toUpperCase();
      // Don't add unneccesary permutations when ch is not a letter
      if (lowerCaseChar === upperCaseChar) {
        return [prefix + ch];
      } else {
        return [prefix + lowerCaseChar, prefix + upperCaseChar];
      }
    }));
  }
  return permutations;
}

// XXX maybe this belongs in the check package
var NonEmptyString = Match.Where(function (x) {
  check(x, String);
  return x.length > 0;
});

var userQueryValidator = Match.Where(function (user) {
  check(user, {
    id: Match.Optional(NonEmptyString),
    username: Match.Optional(NonEmptyString),
    email: Match.Optional(NonEmptyString)
  });
  if (_.keys(user).length !== 1)
    throw new Match.Error("User property must have exactly one field");
  return true;
});

var passwordValidator = Match.OneOf(
  String,
  { digest: String, algorithm: String }
);

// Handler to login with a password.
//
// The Meteor client sets options.password to an object with keys
// 'digest' (set to SHA256(password)) and 'algorithm' ("sha-256").
//
// For other DDP clients which don't have access to SHA, the handler
// also accepts the plaintext password in options.password as a string.
//
// (It might be nice if servers could turn the plaintext password
// option off. Or maybe it should be opt-in, not opt-out?
// Accounts.config option?)
//
// Note that neither password option is secure without SSL.
//
Accounts.registerLoginHandler("password", function (options) {
  if (! options.password || options.srp)
    return undefined; // don't handle

  check(options, {
    user: userQueryValidator,
    password: passwordValidator
  });


  var user = findUserFromQuery(options.user);
  if (!user)
    throw new Meteor.Error(403, "User not found");

  if (!user.services || !user.services.password ||
      !(user.services.password.bcrypt || user.services.password.srp))
    throw new Meteor.Error(403, "User has no password set");

  if (!user.services.password.bcrypt) {
    if (typeof options.password === "string") {
      // The client has presented a plaintext password, and the user is
      // not upgraded to bcrypt yet. We don't attempt to tell the client
      // to upgrade to bcrypt, because it might be a standalone DDP
      // client doesn't know how to do such a thing.
      var verifier = user.services.password.srp;
      var newVerifier = SRP.generateVerifier(options.password, {
        identity: verifier.identity, salt: verifier.salt});

      if (verifier.verifier !== newVerifier.verifier) {
        return {
          userId: user._id,
          error: new Meteor.Error(403, "Incorrect password")
        };
      }

      return {userId: user._id};
    } else {
      // Tell the client to use the SRP upgrade process.
      throw new Meteor.Error(400, "old password format", EJSON.stringify({
        format: 'srp',
        identity: user.services.password.srp.identity
      }));
    }
  }

  return checkPassword(
    user,
    options.password
  );
});

// Handler to login using the SRP upgrade path. To use this login
// handler, the client must provide:
//   - srp: H(identity + ":" + password)
//   - password: a string or an object with properties 'digest' and 'algorithm'
//
// We use `options.srp` to verify that the client knows the correct
// password without doing a full SRP flow. Once we've checked that, we
// upgrade the user to bcrypt and remove the SRP information from the
// user document.
//
// The client ends up using this login handler after trying the normal
// login handler (above), which throws an error telling the client to
// try the SRP upgrade path.
//
// XXX COMPAT WITH 0.8.1.3
Accounts.registerLoginHandler("password", function (options) {
  if (!options.srp || !options.password)
    return undefined; // don't handle

  check(options, {
    user: userQueryValidator,
    srp: String,
    password: passwordValidator
  });

  var user = findUserFromQuery(options.user);
  if (!user)
    throw new Meteor.Error(403, "User not found");

  // Check to see if another simultaneous login has already upgraded
  // the user record to bcrypt.
  if (user.services && user.services.password && user.services.password.bcrypt)
    return checkPassword(user, options.password);

  if (!(user.services && user.services.password && user.services.password.srp))
    throw new Meteor.Error(403, "User has no password set");

  var v1 = user.services.password.srp.verifier;
  var v2 = SRP.generateVerifier(
    null,
    {
      hashedIdentityAndPassword: options.srp,
      salt: user.services.password.srp.salt
    }
  ).verifier;
  if (v1 !== v2)
    return {
      userId: user._id,
      error: new Meteor.Error(403, "Incorrect password")
    };

  // Upgrade to bcrypt on successful login.
  var salted = hashPassword(options.password);
  Meteor.users.update(
    user._id,
    {
      $unset: { 'services.password.srp': 1 },
      $set: { 'services.password.bcrypt': salted }
    }
  );

  return {userId: user._id};
});


///
/// CHANGING
///

// Let the user change their own password if they know the old
// password. `oldPassword` and `newPassword` should be objects with keys
// `digest` and `algorithm` (representing the SHA256 of the password).
//
// XXX COMPAT WITH 0.8.1.3
// Like the login method, if the user hasn't been upgraded from SRP to
// bcrypt yet, then this method will throw an 'old password format'
// error. The client should call the SRP upgrade login handler and then
// retry this method again.
//
// UNLIKE the login method, there is no way to avoid getting SRP upgrade
// errors thrown. The reasoning for this is that clients using this
// method directly will need to be updated anyway because we no longer
// support the SRP flow that they would have been doing to use this
// method previously.
Meteor.methods({changePassword: function (oldPassword, newPassword) {
  check(oldPassword, passwordValidator);
  check(newPassword, passwordValidator);

  if (!this.userId)
    throw new Meteor.Error(401, "Must be logged in");

  var user = Meteor.users.findOne(this.userId);
  if (!user)
    throw new Meteor.Error(403, "User not found");

  if (!user.services || !user.services.password ||
      (!user.services.password.bcrypt && !user.services.password.srp))
    throw new Meteor.Error(403, "User has no password set");

  if (! user.services.password.bcrypt) {
    throw new Meteor.Error(400, "old password format", EJSON.stringify({
      format: 'srp',
      identity: user.services.password.srp.identity
    }));
  }

  var result = checkPassword(user, oldPassword);
  if (result.error)
    throw result.error;

  var hashed = hashPassword(newPassword);

  // It would be better if this removed ALL existing tokens and replaced
  // the token for the current connection with a new one, but that would
  // be tricky, so we'll settle for just replacing all tokens other than
  // the one for the current connection.
  var currentToken = Accounts._getLoginToken(this.connection.id);
  Meteor.users.update(
    { _id: this.userId },
    {
      $set: { 'services.password.bcrypt': hashed },
      $pull: {
        'services.resume.loginTokens': { hashedToken: { $ne: currentToken } }
      },
      $unset: { 'services.password.reset': 1 }
    }
  );

  return {passwordChanged: true};
}});


// Force change the users password.

/**
 * @summary Forcibly change the password for a user.
 * @locus Server
 * @param {String} userId The id of the user to update.
 * @param {String} newPassword A new password for the user.
 * @param {Object} [options]
 * @param {Object} options.logout Logout all current connections with this userId (default: true)
 */
Accounts.setPassword = function (userId, newPlaintextPassword, options) {
  options = _.extend({logout: true}, options);

  var user = Meteor.users.findOne(userId);
  if (!user)
    throw new Meteor.Error(403, "User not found");

  var update = {
    $unset: {
      'services.password.srp': 1, // XXX COMPAT WITH 0.8.1.3
      'services.password.reset': 1
    },
    $set: {'services.password.bcrypt': hashPassword(newPlaintextPassword)}
  };

  if (options.logout) {
    update.$unset['services.resume.loginTokens'] = 1;
  }

  Meteor.users.update({_id: user._id}, update);
};


///
/// RESETTING VIA EMAIL
///

// Method called by a user to request a password reset email. This is
// the start of the reset process.
Meteor.methods({forgotPassword: function (options) {
  check(options, {email: String});

  var user = Meteor.users.findOne({"emails.address": options.email});
  if (!user)
    throw new Meteor.Error(403, "User not found");

  Accounts.sendResetPasswordEmail(user._id, options.email);
}});

// send the user an email with a link that when opened allows the user
// to set a new password, without the old password.

/**
 * @summary Send an email with a link the user can use to reset their password.
 * @locus Server
 * @param {String} userId The id of the user to send email to.
 * @param {String} [email] Optional. Which address of the user's to send the email to. This address must be in the user's `emails` list. Defaults to the first email in the list.
 */
Accounts.sendResetPasswordEmail = function (userId, email) {
  // Make sure the user exists, and email is one of their addresses.
  var user = Meteor.users.findOne(userId);
  if (!user)
    throw new Error("Can't find user");
  // pick the first email if we weren't passed an email.
  if (!email && user.emails && user.emails[0])
    email = user.emails[0].address;
  // make sure we have a valid email
  if (!email || !_.contains(_.pluck(user.emails || [], 'address'), email))
    throw new Error("No such email for user.");

  var token = Random.secret();
  var when = new Date();
  var tokenRecord = {
    token: token,
    email: email,
    when: when
  };
  Meteor.users.update(userId, {$set: {
    "services.password.reset": tokenRecord
  }});
  // before passing to template, update user object with new token
  Meteor._ensure(user, 'services', 'password').reset = tokenRecord;

  var resetPasswordUrl = Accounts.urls.resetPassword(token);

  var options = {
    to: email,
    from: Accounts.emailTemplates.resetPassword.from
      ? Accounts.emailTemplates.resetPassword.from(user)
      : Accounts.emailTemplates.from,
    subject: Accounts.emailTemplates.resetPassword.subject(user)
  };

  if (typeof Accounts.emailTemplates.resetPassword.text === 'function') {
    options.text =
      Accounts.emailTemplates.resetPassword.text(user, resetPasswordUrl);
  }

  if (typeof Accounts.emailTemplates.resetPassword.html === 'function')
    options.html =
      Accounts.emailTemplates.resetPassword.html(user, resetPasswordUrl);

  if (typeof Accounts.emailTemplates.headers === 'object') {
    options.headers = Accounts.emailTemplates.headers;
  }

  Email.send(options);
};

// send the user an email informing them that their account was created, with
// a link that when opened both marks their email as verified and forces them
// to choose their password. The email must be one of the addresses in the
// user's emails field, or undefined to pick the first email automatically.
//
// This is not called automatically. It must be called manually if you
// want to use enrollment emails.

/**
 * @summary Send an email with a link the user can use to set their initial password.
 * @locus Server
 * @param {String} userId The id of the user to send email to.
 * @param {String} [email] Optional. Which address of the user's to send the email to. This address must be in the user's `emails` list. Defaults to the first email in the list.
 */
Accounts.sendEnrollmentEmail = function (userId, email) {
  // XXX refactor! This is basically identical to sendResetPasswordEmail.

  // Make sure the user exists, and email is in their addresses.
  var user = Meteor.users.findOne(userId);
  if (!user)
    throw new Error("Can't find user");
  // pick the first email if we weren't passed an email.
  if (!email && user.emails && user.emails[0])
    email = user.emails[0].address;
  // make sure we have a valid email
  if (!email || !_.contains(_.pluck(user.emails || [], 'address'), email))
    throw new Error("No such email for user.");

  var token = Random.secret();
  var when = new Date();
  var tokenRecord = {
    token: token,
    email: email,
    when: when
  };
  Meteor.users.update(userId, {$set: {
    "services.password.reset": tokenRecord
  }});

  // before passing to template, update user object with new token
  Meteor._ensure(user, 'services', 'password').reset = tokenRecord;

  var enrollAccountUrl = Accounts.urls.enrollAccount(token);

  var options = {
    to: email,
    from: Accounts.emailTemplates.enrollAccount.from
      ? Accounts.emailTemplates.enrollAccount.from(user)
      : Accounts.emailTemplates.from,
    subject: Accounts.emailTemplates.enrollAccount.subject(user)
  };

  if (typeof Accounts.emailTemplates.enrollAccount.text === 'function') {
    options.text =
      Accounts.emailTemplates.enrollAccount.text(user, enrollAccountUrl);
  }

  if (typeof Accounts.emailTemplates.enrollAccount.html === 'function')
    options.html =
      Accounts.emailTemplates.enrollAccount.html(user, enrollAccountUrl);

  if (typeof Accounts.emailTemplates.headers === 'object') {
    options.headers = Accounts.emailTemplates.headers;
  }

  Email.send(options);
};


// Take token from sendResetPasswordEmail or sendEnrollmentEmail, change
// the users password, and log them in.
Meteor.methods({resetPassword: function (token, newPassword) {
  var self = this;
  return Accounts._loginMethod(
    self,
    "resetPassword",
    arguments,
    "password",
    function () {
      check(token, String);
      check(newPassword, passwordValidator);

      var user = Meteor.users.findOne({
        "services.password.reset.token": token});
      if (!user)
        throw new Meteor.Error(403, "Token expired");
      var email = user.services.password.reset.email;
      if (!_.include(_.pluck(user.emails || [], 'address'), email))
        return {
          userId: user._id,
          error: new Meteor.Error(403, "Token has invalid email address")
        };

      var hashed = hashPassword(newPassword);

      // NOTE: We're about to invalidate tokens on the user, who we might be
      // logged in as. Make sure to avoid logging ourselves out if this
      // happens. But also make sure not to leave the connection in a state
      // of having a bad token set if things fail.
      var oldToken = Accounts._getLoginToken(self.connection.id);
      Accounts._setLoginToken(user._id, self.connection, null);
      var resetToOldToken = function () {
        Accounts._setLoginToken(user._id, self.connection, oldToken);
      };

      try {
        // Update the user record by:
        // - Changing the password to the new one
        // - Forgetting about the reset token that was just used
        // - Verifying their email, since they got the password reset via email.
        var affectedRecords = Meteor.users.update(
          {
            _id: user._id,
            'emails.address': email,
            'services.password.reset.token': token
          },
          {$set: {'services.password.bcrypt': hashed,
                  'emails.$.verified': true},
           $unset: {'services.password.reset': 1,
                    'services.password.srp': 1}});
        if (affectedRecords !== 1)
          return {
            userId: user._id,
            error: new Meteor.Error(403, "Invalid email")
          };
      } catch (err) {
        resetToOldToken();
        throw err;
      }

      // Replace all valid login tokens with new ones (changing
      // password should invalidate existing sessions).
      Accounts._clearAllLoginTokens(user._id);

      return {userId: user._id};
    }
  );
}});

// ///
// /// EMAIL VERIFICATION
// ///


// // send the user an email with a link that when opened marks that
// // address as verified

// /**
//  * @summary Send an email with a link the user can use verify their email address.
//  * @locus Server
//  * @param {String} userId The id of the user to send email to.
//  * @param {String} [email] Optional. Which address of the user's to send the email to. This address must be in the user's `emails` list. Defaults to the first unverified email in the list.
//  */
// Accounts.sendVerificationEmail = function (userId, address) {
//   // XXX Also generate a link using which someone can delete this
//   // account if they own said address but weren't those who created
//   // this account.

//   // Make sure the user exists, and address is one of their addresses.
//   var user = Accounts.dbClient.getUserById(userId);
//   if (!user)
//     throw new Error("Can't find user");
//   // pick the first unverified address if we weren't passed an address.
//   if (!address) {
//     var email = _.find(user.emails || [],
//                        function (e) { return !e.verified; });
//     address = (email || {}).address;
//   }
//   // make sure we have a valid address
//   if (!address || !_.contains(_.pluck(user.emails || [], 'address'), address))
//     throw new Error("No such email address for user.");


//   var tokenRecord = {
//     token: Random.secret(),
//     address: address,
//     when: new Date()};

//   Meteor.users.update(
//     {_id: userId},
//     {$push: {'services.email.verificationTokens': tokenRecord}});

//   // before passing to template, update user object with new token
//   Meteor._ensure(user, 'services', 'email');
//   if (!user.services.email.verificationTokens) {
//     user.services.email.verificationTokens = [];
//   }
//   user.services.email.verificationTokens.push(tokenRecord);

//   var verifyEmailUrl = Accounts.urls.verifyEmail(tokenRecord.token);

//   var options = {
//     to: address,
//     from: Accounts.emailTemplates.verifyEmail.from
//       ? Accounts.emailTemplates.verifyEmail.from(user)
//       : Accounts.emailTemplates.from,
//     subject: Accounts.emailTemplates.verifyEmail.subject(user)
//   };

//   if (typeof Accounts.emailTemplates.verifyEmail.text === 'function') {
//     options.text =
//       Accounts.emailTemplates.verifyEmail.text(user, verifyEmailUrl);
//   }

//   if (typeof Accounts.emailTemplates.verifyEmail.html === 'function')
//     options.html =
//       Accounts.emailTemplates.verifyEmail.html(user, verifyEmailUrl);

//   if (typeof Accounts.emailTemplates.headers === 'object') {
//     options.headers = Accounts.emailTemplates.headers;
//   }

//   Email.send(options);
// };

// Take token from sendVerificationEmail, mark the email as verified,
// and log them in.
Meteor.methods({verifyEmail: function (token) {
  var self = this;
  return Accounts._loginMethod(
    self,
    "verifyEmail",
    arguments,
    "password",
    function () {
      check(token, String);

      var user = Meteor.users.findOne(
        {'services.email.verificationTokens.token': token});
      if (!user)
        throw new Meteor.Error(403, "Verify email link expired");

      var tokenRecord = _.find(user.services.email.verificationTokens,
                               function (t) {
                                 return t.token == token;
                               });
      if (!tokenRecord)
        return {
          userId: user._id,
          error: new Meteor.Error(403, "Verify email link expired")
        };

      var emailsRecord = _.find(user.emails, function (e) {
        return e.address == tokenRecord.address;
      });
      if (!emailsRecord)
        return {
          userId: user._id,
          error: new Meteor.Error(403, "Verify email link is for unknown address")
        };

      // By including the address in the query, we can use 'emails.$' in the
      // modifier to get a reference to the specific object in the emails
      // array. See
      // http://www.mongodb.org/display/DOCS/Updating/#Updating-The%24positionaloperator)
      // http://www.mongodb.org/display/DOCS/Updating#Updating-%24pull
      Meteor.users.update(
        {_id: user._id,
         'emails.address': tokenRecord.address},
        {$set: {'emails.$.verified': true},
         $pull: {'services.email.verificationTokens': {address: tokenRecord.address}}});

      return {userId: user._id};
    }
  );
}});



///
/// CREATING USERS
///

// Shared createUser function called from the createUser method, both
// if originates in client or server code. Calls user provided hooks,
// does the actual user insertion.
//
// returns the user id
var createUser = function (options) {
  // Unknown keys allowed, because a onCreateUserHook can take arbitrary
  // options.
  check(options, Match.ObjectIncluding({
    username: Match.Optional(String),
    email: Match.Optional(String),
    password: Match.Optional(passwordValidator)
  }));

  var username = options.username;
  var email = options.email;
  if (!username && !email)
    throw new Meteor.Error(400, "Need to set a username or email");

  var user = {services: {}};
  if (options.password) {
    var hashed = hashPassword(options.password);
    user.services.password = { bcrypt: hashed };
  }

  if (username)
    user.username = username;
  if (email)
    user.emails = [{address: email, verified: false}];

  // // Check if there is no other user with a username or email only differing
  // // in case.
  // var performCaseInsensitiveCheck = function () {
  //   // Some tests need the ability to add users with the same case insensitive
  //   // username or email, hence the _skipCaseInsensitiveChecksForTest check

  //   if (username &&
  //     !_.has(Accounts._skipCaseInsensitiveChecksForTest, username) &&
  //     Meteor.users.find(selectorForFastCaseInsensitiveLookup(
  //       "username", username)).count() > 1) {
  //         throw new Meteor.Error(403, "Username already exists.");
  //   }

  //   if (email &&
  //     !_.has(Accounts._skipCaseInsensitiveChecksForTest, email) &&
  //     Meteor.users.find(selectorForFastCaseInsensitiveLookup(
  //       "emails.address", email)).count() > 1) {
  //       throw new Meteor.Error(403, "Email already exists.");
  //   }
  // }

  // // Perform a case insensitive check before insert
  // performCaseInsensitiveCheck();
  var userId = Accounts.insertUserDoc(options, user);
  return userId;
};

// method for create user. Requests come from the client.
Meteor.methods({createUser: function (options) {
  var self = this;
  return Accounts._loginMethod(
    self,
    "createUser",
    arguments,
    "password",
    function () {
      // createUser() above does more checking.
      check(options, Object);
      if (Accounts._options.forbidClientAccountCreation)
        return {
          error: new Meteor.Error(403, "Signups forbidden")
        };

      // Create user. result contains id and token.
      var userId = createUser(options);
      // safety belt. createUser is supposed to throw on error. send 500 error
      // instead of sending a verification email with empty userid.
      if (! userId)
        throw new Error("createUser failed to insert new user");

      // // If `Accounts._options.sendVerificationEmail` is set, register
      // // a token to verify the user's primary email, and send it to
      // // that address.
      // if (options.email && Accounts._options.sendVerificationEmail)
      //   Accounts.sendVerificationEmail(userId, options.email);

      // client gets logged in as the new user afterwards.
      return {userId: userId};
    }
  );
}});

// Create user directly on the server.
//
// Unlike the client version, this does not log you in as this user
// after creation.
//
// returns userId or throws an error if it can't create
//
// XXX add another argument ("server options") that gets sent to onCreateUser,
// which is always empty when called from the createUser method? eg, "admin:
// true", which we want to prevent the client from setting, but which a custom
// method calling Accounts.createUser could set?
//
Accounts.createUser = function (options, callback) {
  options = _.clone(options);

  // XXX allow an optional callback?
  if (callback) {
    throw new Error("Accounts.createUser with callback not supported on the server yet.");
  }

  return createUser(options);
};

///
/// PASSWORD-SPECIFIC INDEXES ON USERS
///
// Meteor.users._ensureIndex('services.email.verificationTokens.token',
//                           {unique: 1, sparse: 1});
// Meteor.users._ensureIndex('services.password.reset.token',
//                           {unique: 1, sparse: 1});
