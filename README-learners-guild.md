# Learners Guild Rocket.Chat

[![Code Climate GPA](https://codeclimate.com/repos/579a5a518945080085002118/badges/169989a20bb55ad089d5/gpa.svg)](https://codeclimate.com/repos/579a5a518945080085002118/feed)
[![Code Climate Issue Count](https://codeclimate.com/repos/579a5a518945080085002118/badges/169989a20bb55ad089d5/issue_count.svg)](https://codeclimate.com/repos/579a5a518945080085002118/feed)
[![Test Coverage](https://codeclimate.com/repos/579a5a518945080085002118/badges/169989a20bb55ad089d5/coverage.svg)](https://codeclimate.com/repos/579a5a518945080085002118/coverage)

This is Learners Guild's custom fork of Rocket.Chat. The primary difference is the presence of a few custom plugins, a small startup script, and this readme.

## Production Monitoring

Production monitoring for this service is via [kadira][kadira].

## Getting Started

1. **IMPORTANT:** Be sure to first set up the [idm][idm] and [game][game] services.

2. Clone the repository.

3. Checkout the `lg-master` branch (if not checked out by default).

4. Setup and run [mehserve][mehserve]. Then figure out which port you intend to use and create the mehserve config file:

```bash
echo 3000 > ~/.mehserve/echo.learnersguild
```

5. Set your `NODE_ENV` environment variable:

```bash
export NODE_ENV=development
```

6. Create your `.env` file for your environment. Example:

```bash
ROOT_URL=http://echo.learnersguild.dev/
CHAT_API_USER_SECRET='s3cr3t-p@ssw0rd'
JWT_PUBLIC_KEY="<IDM PUBLIC KEY (let it
span
multiple
lines)>
"
```

7. Install [Meteor][meteor]

```bash
curl https://install.meteor.com/ | sh
```

8. Run the server:

```bash
npm run lg:start
```

9. Configure Direct Message Webhook

See https://github.com/LearnersGuild/echo-chat/issues/50

## Troubleshooting

- Issue: attempting to update dependencies results in this error:
  ```
  essjay:echo-chat essjay-lg$ meteor add learnersguild:rocketchat-lg-sso
  learnersguild:rocketchat-lg-sso: updating npm dependencies -- @learnersguild/idm-jwt-auth...
   => Errors while adding packages:

  While building package learnersguild:rocketchat-lg-sso:
  error: couldn't install npm package @learnersguild/idm-jwt-auth@0.2.4: Command failed: npm ERR! 404 Not Found
  npm ERR! 404
  npm ERR! 404 'learnersguild/idm-jwt-auth' is not in the npm registry.
  npm ERR! 404 You should bug the author to publish it
  npm ERR! 404
  npm ERR! 404 Note that you can also install from a
  npm ERR! 404 tarball, folder, or http url, or git url.
  ```

  You might have run into an issue with installing scoped packages from NPM and incompatibility with the version of NPM used by meteor. Try updating it:
  ```
  cd ~/.meteor/packages/meteor-tool/1.1.*/mt-*/dev_bundle/lib
  ../bin/npm install npm
  ```


## Differences from Upstream

In order to maintain our own sanity, rather than making lots and lots of changes to Rocket.Chat, we've chosen a strategy of using the Meteor package system to isolate our changes in a manageable way. Specifically, we've _removed_ the following packages from stock Rocket.Chat:

- rocketchat:slashcommands-archive
- rocketchat:slashcommands-asciiarts
- rocketchat:slashcommands-create
- rocketchat:slashcommands-kick
- rocketchat:slashcommands-me
- rocketchat:slashcommands-mute
- rocketchat:slashcommands-topic
- rocketchat:slashcommands-unarchive

In addition, we've consolidated all of our custom code into our own custom packages. At the time of this writing, those are:

- learnersguild:rocketchat-lg-core
- learnersguild:rocketchat-lg-sso
- learnersguild:rocketchat-lg-api-extensions
- learnersguild:rocketchat-lg-game

To simplify release management and deployment and make things as easy as possible, we're simply including these packages in the `packages` directory on the `lg-master` branch of our Rocket.Chat fork (this repository).

### IMPORTANT -- making changes

If you need to make changes, they should in 99% of cases be made within our custom packages. If you make changes elsewhere, _you're most likely doing something wrong_. We always want to be able to pull-in upstream changes, so we don't want to deviate from upstream packages. You can always add another custom package if you need to, and you can also remove any of the standard Rocket.Chat packages (since those end up just being a few lines changed in the `.meteor/packages` and `.meteor/versions` files).

Thus, any changes you make to Rocket.Chat core packages should be:

- made from the `develop` branch after sync'ing it with upstream
- made in a way that a PR will be accepted
- you'll likely need to cherry-pick it into `lg-master` at that point

Detailed instructions follow ...


## Need to send a PR upstream to Rocket.Chat?

1. First, make sure we are tracking `upstream` via git:

```bash
git remote add upstream git@github.com:RocketChat/Rocket.Chat.git
git remote update
```

2. Then, make sure our `develop` branch is sync'ed with `upstream`. If it's your first time:

```bash
git checkout -b develop origin/develop
```

     If you've already worked from the `develop` branch before:

```bash
git checkout develop
```

3. Merge any changes from `upstream`:

```bash
git merge upstream/develop
```

4. Create a branch for your fix. Replace `YOUR_BRANCH_NAME` with something sensible, like your initials followed by the fix you're making, e.g., `jw/fix-double-notifications`:

```bash
git checkout -b YOUR_BRANCH_NAME
```

5. Make your changes. Test them. Commit to your branch, then push to origin:

```bash
git push -u origin YOUR_BRANCH_NAME
```

6. Then go [submit the pull request on Rocket.Chat upstream][rocket-chat-pr].

7. No need to wait for Rocket.Chat to merge-in your changes, though you might need to cherry-pick the commit from the `develop` branch into the `lg-master` branch.


[mehserve]: https://github.com/timecounts/mehserve
[meteor]: https://www.meteor.com/
[rocket-chat-pr]: https://github.com/RocketChat/Rocket.Chat/pulls
[idm]: https://github.com/LearnersGuild/idm
[game]: https://github.com/LearnersGuild/game
[semver]: http://semver.org/
[kadira]: https://ui.kadira.io/
[git-subrepo]: https://github.com/ingydotnet/git-subrepo
