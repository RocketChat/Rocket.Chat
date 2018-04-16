# Release {version}
We are releasing a new version, this issue will keep track of the progress between the first release candidate (20th of each month) to the final release (27th of each month).

After the 20th of each month we start the release process that ends 7 days after, during that period we enter a Feature Freeze. While in the Feature Freeze, we will only be merging bug fixes and not new features.

For any regression, open a new issue and link to this one.


## Before Release - Preparation - 1 business day before the day 20th
- [x] Create the issue to track the release progress
- [ ] Define the highlights from release PRs as suggestion to be included on Blog Post
- [ ] Talk to the Marketing Team about the Blog Post release
- [ ] Talk to the Documentation Team about the Docs release
- [ ] Sync translations from [LingoHub](https://translate.lingohub.com/rocketchat/rocket-dot-chat/dashboard)

## Release Candidate 1 - On the 20th
- [ ] Delete branch `release-candidate`
- [ ] Create branch `release-candidate` based on `develop`
- [ ] On branch `release-candidate` run `npm run release` and follow the steps
- [ ] Publish the branch and the generated tag
- [ ] Edit the tag on GitHub and paste the generated History removing the version from the first line and mark the checkbox **This is a pre-release**
- [ ] Ensure the build is passing on CircleCI
- [ ] Ensure the build is passing on Docker Hub

<!-- Copy following block for next release candidates
## Release Candidate {release-candidate-version}
- [ ] Merge `develop` into `release-candidate` branch
- [ ] On branch `release-candidate` run `npm run release` and follow the steps
- [ ] Publish the branch and the generated tag
- [ ] Edit the tag on GitHub and paste the generated History removing the version from the first line and mark the checkbox **This is a pre-release**
- [ ] Ensure the build is passing on CircleCI
- [ ] Ensure the build is passing on Docker Hub
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
- [ ] Ensure the build is passing on CircleCI
- [ ] Ensure the build is passing on Docker Hub
- [ ] When build is passing ask for approval
- [ ] When approved merge it!
- [ ] When merged edit the release/tag and publish it

## After Release - Conclusion - 1 business day after the 27th
- [ ] Check if related issues was closed
- [ ] Check if related issues was assigned to the correct milestone
- [ ] Check with the Marketing Team about the Blog Post release
- [ ] Check with the Documentation Team about the Docs release
- [ ] Create a Sync PR to merge back master to develop
- [ ] Merge Sync PR
