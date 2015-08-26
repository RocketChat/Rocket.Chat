// XXX Most of the testing of accounts-ui is done manually, across
// multiple browsers using examples/unfinished/accounts-ui-helper. We
// should *definitely* automate this, but Tinytest is generally not
// the right abstraction to use for this.


// XXX it'd be cool to also test that the right thing happens if options
// *are* validated, but Accounts.ui._options is global state which makes this hard
// (impossible?)
Tinytest.add('accounts-ui - config validates keys', function (test) {
  test.throws(function () {
    Accounts.ui.config({foo: "bar"});
  });

  test.throws(function () {
    Accounts.ui.config({passwordSignupFields: "not a valid option"});
  });

  test.throws(function () {
    Accounts.ui.config({requestPermissions: {facebook: "not an array"}});
  });

  test.throws(function () {
    Accounts.ui.config({forceApprovalPrompt: {facebook: "only google"}});
  });
});
