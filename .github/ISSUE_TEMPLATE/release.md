---
name: Release
about: Internal release checklist template

---

# Release {version}
We are releasing a new version, this issue will keep track of the progress between the first release candidate (20th of each month) to the final release (27th of each month).

Beginning on the 20th of each month, we will start the release process which ends 7 days later (the 27th). During this period of time, we will enter a "Feature Freeze". This Feature Freeze means that we will only be merging pull requests which fix bugs and not ones that add new features.

When you find a bug that is a regression, please open a new issue and link it to this one.


## Before Release - Preparation - 1 business day before the day 20th
- [x] Create the issue to track the release progress
- [ ] Define the highlights from release PRs as a suggestion to be included on Blog Post <!-- link to the website's issue -->
- [ ] Talk to the Marketing Team about starting the release Blog Post
- [ ] Talk to the Documentation Team about ensuring the Docs are up to date and all pull requests are merged
- [ ] Sync translations from [LingoHub](https://translate.lingohub.com/rocketchat/rocket-dot-chat/dashboard)

## Release Candidate 1 - On the 20th
- [ ] Execute action `Release Candidate` via [Houston CLI](https://github.com/RocketChat/Rocket.Chat.Houston) (`houston release`)
- [ ] Check if `release-candidate` branch was published
- [ ] Check if the tag was published and contains the history
- [ ] Ensure the build is passing on [CircleCI](https://circleci.com/gh/RocketChat/Rocket.Chat)
- [ ] Ensure the image was sent to [Docker Hub](https://hub.docker.com/r/rocketchat/rocket.chat/tags/)

<!-- Copy following block for next release candidates
## Release Candidate {release-candidate-version} - On the {day}
- [ ] Execute action `Release Candidate` via [Houston CLI](https://github.com/RocketChat/Rocket.Chat.Houston) (`houston release`)
- [ ] Check if `release-candidate` branch was published
- [ ] Check if the tag was published and contains the history
- [ ] Ensure the build is passing on [CircleCI](https://circleci.com/gh/RocketChat/Rocket.Chat)
- [ ] Ensure the image was sent to [Docker Hub](https://hub.docker.com/r/rocketchat/rocket.chat/tags/)
-->

## Final Release - On the 27th
- [ ] Execute action `Final Release` via [Houston CLI](https://github.com/RocketChat/Rocket.Chat.Houston) (`houston release`)
- [ ] Check if `release-{version}` branch was published
- [ ] Check if the release was created as **draft** and contains the history
- [ ] Check if the release Pull Request was created and contains the history
- [ ] Ensure the **Pull Request** build is passing on [CircleCI](https://circleci.com/gh/RocketChat/Rocket.Chat)
- [ ] When the build is passing ask for Pull Request approval
- [ ] When approved, merge it!
- [ ] Ensure the **Tag** build is passing on [CircleCI](https://circleci.com/gh/RocketChat/Rocket.Chat)
- [ ] Ensure the image was sent to [Docker Hub](https://hub.docker.com/r/rocketchat/rocket.chat/tags/)
- [ ] After all edit the release/tag and publish it

## After Release - Conclusion - 1 business day after the 27th
- [ ] Ensure all of the related issues were closed
- [ ] Determine if all of the related issues were correctly assigned to this version's milestone
- [ ] Get an update from Marketing Team about the release of Blog Post
- [ ] Check with the Documentation Team about the Docs release
- [ ] Sync develop
  - [ ] Execute action `Develop Sync` via [Houston CLI](https://github.com/RocketChat/Rocket.Chat.Houston) (`houston release`)
  - [ ] Ensure the **Pull Request** build is passing on [CircleCI](https://circleci.com/gh/RocketChat/Rocket.Chat)
  - [ ] When the build has passed, ask for approval and wait
  - [ ] Merge Sync PR
