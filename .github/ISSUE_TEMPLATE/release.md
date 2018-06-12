---
name: Release
about: Internal release checklist template

---

# Release {version}
We are releasing a new version, this issue will keep track of the progress between the first release candidate (20th of each month) to the final release (27th of each month).

Beginning on the 20th of each month, we will start the release process which ends 7 days later (the 27th). During this period of time, we will enter a "Feature Freeze". This Feature Freeze means that we will only be merging pull requests which fix bugs and not ones which add new features.

When you find a bug that is a regression, please open a new issue and link it to this one.


## Before Release - Preparation - 1 business day before the day 20th
- [x] Create the issue to track the release progress
- [ ] Define the highlights from release PRs as suggestion to be included on Blog Post <!-- link to the website's issue -->
- [ ] Talk to the Marketing Team about starting the release Blog Post
- [ ] Talk to the Documentation Team about ensuring the Docs are up to date and all pull requests are merged
- [ ] Sync translations from [LingoHub](https://translate.lingohub.com/rocketchat/rocket-dot-chat/dashboard)

## Release Candidate 1 - On the 20th
- [ ] Delete branch `release-candidate`
- [ ] Create branch `release-candidate` based on `develop`
- [ ] On branch `release-candidate` run `npm run release` and follow the steps
- [ ] Publish the branch and the generated tag
- [ ] Edit the tag on GitHub and paste the generated History removing the version from the first line and mark the checkbox **This is a pre-release**
- [ ] Ensure the build is passing on [CircleCI](https://circleci.com/gh/RocketChat/Rocket.Chat)
- [ ] Ensure the build is passing on [Docker Hub](https://hub.docker.com/r/rocketchat/rocket.chat/builds/)

<!-- Copy following block for next release candidates
## Release Candidate {release-candidate-version}
- [ ] Merge `develop` into `release-candidate` branch
- [ ] On branch `release-candidate` run `npm run release` and follow the steps
- [ ] Publish the branch and the generated tag
- [ ] Edit the tag on GitHub and paste the generated History removing the version from the first line and mark the checkbox **This is a pre-release**
- [ ] Ensure the build is passing on [CircleCI](https://circleci.com/gh/RocketChat/Rocket.Chat)
- [ ] Ensure the build is passing on [Docker Hub](https://hub.docker.com/r/rocketchat/rocket.chat/builds/)
-->

## Final Release - On the 27th
- [ ] Merge `develop` into `release-candidate` branch
- [ ] Create a new branch `release-{version}` based on `release-candidate`
- [ ] On branch `release-{version}` run `npm run release` and follow the steps **TODO: fix the history**
- [ ] Publish only the branch
- [ ] **Draft a new release** on GitHub
  - [ ] Enter tag version as {version}
  - [ ] Select target **master**
  - [ ] Enter release title as {version}
  - [ ] Paste the history removing the version from the first line
  - [ ] Save as **draft**
- [ ] Create a PR from the branch `release-{version}` with the same history from the tag/release
- [ ] Ensure the build is passing on [CircleCI](https://circleci.com/gh/RocketChat/Rocket.Chat)
- [ ] Ensure the build is passing on [Docker Hub](https://hub.docker.com/r/rocketchat/rocket.chat/builds/)
- [ ] When build is passing ask for approval
- [ ] When approved merge it!
- [ ] When merged edit the release/tag and publish it

## After Release - Conclusion - 1 business day after the 27th
- [ ] Ensure all of the related issues were closed
- [ ] Determine if all of the related issues were correctly assigned to the this version's milestone
- [ ] Get an update from Marketing Team about the release Blog Post
- [ ] Check with the Documentation Team about the Docs release
- [ ] Create a Sync PR to merge `master` back into `develop`
- [ ] Ensure the build is passing on [CircleCI](https://circleci.com/gh/RocketChat/Rocket.Chat)
- [ ] When build has passed, ask for approval and wait
- [ ] Merge Sync PR
