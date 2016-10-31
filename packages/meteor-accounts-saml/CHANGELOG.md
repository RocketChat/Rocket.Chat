# Changelog

This is a changelog of changes made to the saml package for RocketChat.
The package is originally based on https://github.com/steffow/meteor-accounts-saml .

## 31-Oct-2016 danb@catalyst-au.net

* Attempt at SP-initiated logout (**requires more work**).
  * Added configuration setting for SLO (single logout) redirect url
    to the IDP.
  * A `Session` key is set called `saml_provider`; it is unset at
    logout.  Is there a better way?
  * `Meteor.logout` on the client is overridden so that
    `Meteor.logoutWithSaml` is called if `saml_provider` is set.  This
    isn't great - is there a better way?
  * Tested using simplesamlphp as the idp
    * login in using saml
    * then logout using the normal RocketChat logout
    * after some time, you should see the RocketChat login screen
    * if you try to login again, you will have to login to the idp again
      repeating the previous login flow
  * **TODO:** If a user has 2 independent browser login sessions using
    saml, both will log out, but only the one the user logged out from
    appears to be properly logged out of the idp.
    * this might be because we shouldn't be logging out the second session
      but RocketChat / meteor is doing this.

## 17-Oct-2016

* Fixed signing for redirect to idp.
  * At login time, if the idp is configured to verify the redirect to its login screen, it will
    expect `RelayState` as part of the signature.
    Tested with **simplesamlphp** with `'redirect.validate' => TRUE` in the `sp-remote` metadata file
  * Added `privateKey` - `SAML_Custom_Private_Key_File_Path`
  * Added `privateCert` - `SAML_Custom_Public_Cert_File_Path`
  * These input fields should point to locations on the the server eg `/path/to/private/certs/`.
  * `privateKey` is used by RocketChat to sign saml requests.
