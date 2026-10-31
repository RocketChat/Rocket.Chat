---
'@rocket.chat/meteor': major
---

The web client no longer ships Meteor's client packages (DDP, accounts, Tracker, Mongo and minimongo): it talks to the server only through the DDP SDK and the REST API. Code that runs in the page and relies on those packages stops working, in particular the custom scripts of the `Custom_Script_On_Logout`, `Custom_Script_Logged_Out` and `Custom_Script_Logged_In` settings and the scripts of integrations that inject JavaScript into the web client. In the browser, `Meteor.userId()`, `Meteor.user()`, `Meteor.call()`, `Meteor.subscribe()`, `Meteor.loginWithToken()`, `Meteor.status()`, `Tracker` and client-side Meteor collections are no longer available. The custom script events still fire on `window`; scripts that need the user can read `Meteor.userId` and `Meteor.loginToken` from `localStorage` (or from `sessionStorage` when `Accounts_ForgetUserSessionOnWindowClose` is on) and call the REST API with them.
