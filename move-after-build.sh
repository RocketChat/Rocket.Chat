#!/usr/bin/env bash
### Some helper functions for getting git-information
# checks if branch has something pending
function parse_git_dirty() {
  git diff --quiet --ignore-submodules HEAD 2>/dev/null; [ $? -eq 1 ] && echo "*"
}

# gets the current git branch
function parse_git_branch() {
  git branch --no-color 2> /dev/null | sed -e '/^[^*]/d' -e "s/* \(.*\)/\1$(parse_git_dirty)/"
}

# get last commit hash prepended with @ (i.e. @8a323d0)
function parse_git_hash() {
  git rev-parse --short HEAD 2> /dev/null | sed "s/\(.*\)/@\1/"
}

git checkout assistify_0

GIT_BRANCH=$(parse_git_branch)$(parse_git_hash)
BUILT_FILE=Rocket.Chat_build_${GIT_BRANCH}.tar.gz


mv ../build_rocket_chat_assistify_0.tar.gz ${BUILT_FILE}

### echo "======= Publishing tarball (only if built on AWS) ======="
aws s3 cp ${BUILT_FILE} s3://202234909779-assistify-eu-central-1-sources/rocketchat --region eu-central-1 --acl bucket-owner-full-control
