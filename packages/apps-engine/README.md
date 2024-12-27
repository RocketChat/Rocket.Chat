## Thoughts While Working (for docs)
- Apps which don't provide a valid uuid4 id will be assigned one, but this is not recommended and your App should provide an id
- The language strings are only done on the clients (`TAPi18next.addResourceBundle(lang, projectName, translations);`)
- The implementer of this should restrict the server setting access and environmental variables. Idea is to allow the implementer to have a default set of restricted ones while letting the admin/owner of the server to restrict it even further or lift the restriction on some more. Simple interface with settings and checkbox to allow/disallow them.  :thinking:

## What does the Apps-Engine enable you to do?
The Apps-Engine is Rocket.Chat's _plugin framework_ - it provides the APIs for Rocket.Chat Apps to interact with the host system.

Currently, a Rocket.Chat App can:
- Listen to message events
  - before/after sent
  - before/after updated
  - before/after deleted
- Listen to room events
  - before/after created
  - before/after deleted
- Send messages to users and livechat visitors
- Register new slash commands
- Register new HTTP endpoints

Some features the Engine allows Apps to use:
- Key-Value Storage system
- App specific settings

## Development environment with Rocket.Chat
When developing new functionalities, you need to integrate the local version of the Apps-Engine with your local version of Rocket.Chat.

First of all, make sure you've installed all required packages and compiled the changes you've made to the Apps-Engine, since that is what Rocket.Chat will execute:
```sh
npm install
npm run compile
```

Now, you need to setup a local Rocket.Chat server, [so head to the project's README for instructions on getting started](https://github.com/RocketChat/Rocket.Chat#development) (if you haven't already). Make sure to actually clone the repo, since you will probably need to add some code to it in order to make your new functionality work.

After that, `cd` into Rocket.Chat folder and run:
```sh
meteor npm install PATH_TO_APPS_ENGINE
```

Where `PATH_TO_APPS_ENGINE` is the path to the Apps-Engine repo you've cloned.

That's it! Now when you start Rocket.Chat with the `meteor` command, it will use your local Apps-Engine instead of the one on NPM :)

Whenever you make changes to the engine, run `npm run compile` again - meteor will take care of restarting the server due to the changes.

## Troubleshooting
1. Sometimes, when you update the Apps-Engine code and compile it while Rocket.Chat is running, you might run on errors similar to these:

```
Unable to resolve some modules:

  "@rocket.chat/apps-engine/definition/AppStatus" in
/Users/dev/rocket.chat/Rocket.Chat/app/apps/client/admin/helpers.js (web.browser)

If you notice problems related to these missing modules, consider running:

  meteor npm install --save @rocket.chat/apps-engine
```

Simply restart the meteor process and it should be fixed.

2. Sometimes when using `meteor npm install PATH_TO_APPS_ENGINE` will cause the following error :-

```
npm ERR! code ENOENT
npm ERR! syscall rename
npm ERR! path PATH_TO_ROCKETCHAT/node_modules/.staging/@rocket.chat/apps-engine-c7135600/node_modules/@babel/code-frame
npm ERR! dest PATH_TO_ROCKETCHAT/node_modules/.staging/@babel/code-frame-f3697825
npm ERR! errno -2
npm ERR! enoent ENOENT: no such file or directory, rename 'PATH_TO_ROCKETCHAT/node_modules/.staging/@rocket.chat/apps-engine-c7135600/node_modules/@babel/code-frame' -> 'PATH_TO_ROCKETCHAT/node_modules/.staging/@babel/code-frame-f3697825'
npm ERR! enoent This is related to npm not being able to find a file.
npm ERR! enoent 
```
Here `PATH_TO_ROCKETCHAT` is the path to the main rocketchat server repo in your system
To correct this we reinstall the package once again deleting the previous package
```
~/Rocket.Chat$ rm -rf node_modules/@rocket.chat/apps-engine
~/Rocket.Chat$ cd PATH_TO_APP_ENGINE
~/Rocket.Chat.Apps-engine$ npm install
~/Rocket.Chat.Apps-engine$ cd PATH_TO_ROCKETCHAT
~/Rocket.Chat$ meteor npm install ../Rocket.Chat.Apps-engine
```

## Implementer Needs to Implement:
- `src/server/storage/AppStorage`
- `src/server/storage/AppLogStorage`
- `src/server/bridges/*`

## Testing Framework:
Makes great usage of TypeScript and decorators: https://github.com/alsatian-test/alsatian/wiki
* To run the tests do: `npm run unit-tests`
* To generate the coverage information: `npm run check-coverage`
* To view the coverage: `npm run view-coverage`

# Rocket.Chat Apps TypeScript Definitions

## Handlers
Handlers are essentially "listeners" for different events, except there are various ways to handle an event.
When something happens there is `pre` and `post` handlers.
The set of `pre` handlers happens before the event is finalized.
The set of `post` handlers happens after the event is finalized.
With that said, the rule of thumb is that if you are going to modify, extend, or change the data backing the event then that should be done in the `pre` handlers. If you are simply wanting to listen for when something happens and not modify anything, then the `post` is the way to go.

The order in which they happen is:
* Pre**Event**Prevent
* Pre**Event**Extend
* Pre**Event**Modify
* Post**Event**

Here is an explanation of what each of them means:
* **Prevent**: This is ran to determine whether the event should be prevented or not.
* **Extend**: This is ran to allow extending the data without being destructive of the data (adding an attachment to a message for example).
* **Modify**: This is ran and allows for destructive changes to the data (change any and everything).
* Post**Event**: Is mostly for simple listening and no changes can be made to the data.

## Generating/Updating Documentation
To update or generate the documentation, please commit your changes first and then in a second commit provide the updated documentation.

# Engage with us
## Share your story
We’d love to hear about [your experience](https://survey.zohopublic.com/zs/e4BUFG) and potentially feature it on our [Blog](https://rocket.chat/case-studies/?utm_source=github&utm_medium=readme&utm_campaign=community).

## Subscribe for Updates
Once a month our marketing team releases an email update with news about product releases, company related topics, events and use cases. [Sign Up!](https://rocket.chat/newsletter/?utm_source=github&utm_medium=readme&utm_campaign=community)
