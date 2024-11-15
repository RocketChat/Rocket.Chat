import { AccountsTest } from "./accounts_client.js";

Tinytest.add("accounts - parse urls for accounts-password", test => {
    const actions = ["reset-password", "verify-email", "enroll-account"];

    // make sure the callback was called the right number of times
    const actionsParsed = [];

    actions.forEach(hashPart => {
      const fakeToken = "asdf";
      
      const hashTokenOnly = `#/${hashPart}/${fakeToken}`;
      AccountsTest.attemptToMatchHash(hashTokenOnly, (token, action) => {
        test.equal(token, fakeToken);
        test.equal(action, hashPart);

        // XXX COMPAT WITH 0.9.3
        if (hashPart === "reset-password") {
          test.equal(Accounts._resetPasswordToken, fakeToken);
        } else if (hashPart === "verify-email") {
          test.equal(Accounts._verifyEmailToken, fakeToken);
        } else if (hashPart === "enroll-account") {
          test.equal(Accounts._enrollAccountToken, fakeToken);
        }

        // Reset variables for the next test
        Accounts._resetPasswordToken = null;
        Accounts._verifyEmailToken = null;
        Accounts._enrollAccountToken = null;

        actionsParsed.push(action);
      });
    });

    // make sure each action is called once, in order
    test.equal(actionsParsed, actions);
  });
