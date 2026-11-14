<!-- This is a pull request template, you do not need to uncomment or remove the comments, they won't show up in the PR text. -->

## Proposed changes (including videos or screenshots)

Fixes transfer comments being truncated with "..." - they now wrap to multiple lines.

Only affects livechat transfer messages, other system messages unchanged.

## Issue(s)

Fixes #26723

## Steps to test or reproduce

1. Transfer a livechat with a long comment (50+ chars)
2. Check the transfer message in the chat
3. Comment should wrap to multiple lines, not get cut off

## Further comments

CSS-only fix, scoped to `livechat_transfer_history` messages only.
