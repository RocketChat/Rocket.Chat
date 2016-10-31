# Changelog

This is a changelog of changes made to the saml package for RocketChat.
The package is originally based on [https://github.com/steffow/meteor-accounts-saml] .

## 17-Oct-2016

* Fixed signing for redirect to idp.
  * At login time, if the idp is configured to verify the redirect to its login screen, it will
    expect `RelayState` as part of the signature.
    Tested with **simplesamlphp** with `'redirect.validate' => TRUE` in the `sp-remote` metadata file
  * Added `privateKey` - `SAML_Custom_Private_Key_File_Path`
  * Added `privateCert` - `SAML_Custom_Public_Cert_File_Path`
  * These input fields should point to locations on the the server eg `/path/to/private/certs/`.
  * `privateKey` is used by RocketChat to sign saml requests.
