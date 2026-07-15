---
'@rocket.chat/meteor': patch
---

fix(video-conference): ring notification for group calls and channels not shown

Group video conference calls (channels and group DMs) sent a `ring` action to room members
but the client's VideoConfManager never handled it — no incoming call popup or ringtone
was shown to any member regardless of license tier.

Additionally, accepting a group call ring incorrectly triggered the 1-1 direct-call
accept/confirm handshake, causing a 5-second timeout error for anyone who clicked Accept.

Fixes:
- Add `ring` case in `VideoConfManager.onVideoConfNotification` delegating to new
  `onGroupCallRing` method which marks the call with `isGroupCall: true`
- In `acceptIncomingCall`, group calls skip the accepted→confirmed signalling and
  call `joinCall` directly
- Register a CE video conference type handler (priority 0) that enables `ringing: true`
  for non-livechat rooms with ≤10 members, so CE installs also dispatch ring notifications

Closes #34910
