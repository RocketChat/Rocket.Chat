meteor-accounts-linkedin
============================

A meteor package for LinkedIn's login service.

### Important
BREAKING CHANGE LinkedIn -> Linkedin inside code from v5.0.0

v4.0.0 works with Meteor@1.6.1 & up

From March 1, 2019 Linkedin will be using only V2 API [Docs](https://docs.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/migration-faq?context=linkedin/consumer/context)

Install
-----------
```
meteor add pauli:accounts-linkedin
```

Usage
-----------

Core principles are the same as native Meteor external services login, all available params are in [meteor documentation](https://docs.meteor.com/api/accounts.html#Meteor-loginWith<ExternalService>). So if you using `{{> loginButtons}}`, it will just appear in the selection.

For custom usage, available functions in **Client**:

    login: ``Meteor.loginWithLinkedin([options], [callback])``
    credential request:``Meteor.requestCredential([options], [callback])``

If you are not using any other external login service, you need to `metoer add service-configuration`, otherwise just config it in server folder:

```js
ServiceConfiguration.configurations.upsert(
  { service: 'linkedin' },
  {
    $set: {
      clientId: "XXXXXXX", // Client ID
      secret: "XXXXXXX" // Client Secret
    }
  }
);
```

As basic Linkedin permission now only allows `r_emailaddress` and `r_liteprofile`, this package by default will return this fields to `user.profile`

```js
    linkedinId, // Specific user id for your application only
    firstName:{
      localized:{
         en_US:'Tina'
      },
      preferredLocale:{
         country:'US',
         language:'en'
      }
    },
    lastName:{
      localized:{
         en_US:'Belcher'
      },
      preferredLocale:{
         country:'US',
         language:'en'
      }
    },
    profilePicture: {
      displayImage, // URN media handle
      identifiersUrl, // Array of links to all available identifiers
    },
    email, // First email from received emails during authentication
    emails, // Array of all received emails during authentication
```

If you want during login process to ask for more fields, you need to pass requestPermissions to options.
To change popup options:
```js
popupOptions = { width: XXX, height: XXX }
```

More info [Linkedin API](https://docs.microsoft.com/en-us/linkedin/consumer/)

License
-----------
[MIT](https://github.com/PauliBuccini/meteor-accounts-linkedin/blob/master/LICENSE)
