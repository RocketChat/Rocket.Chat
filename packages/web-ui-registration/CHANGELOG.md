# @rocket.chat/web-ui-registration

## 1.0.0

### Minor Changes

- [#28795](https://github.com/RocketChat/Rocket.Chat/pull/28795) [`4b5a87c88b1`](https://github.com/RocketChat/Rocket.Chat/commit/4b5a87c88b132c6899ee5023059d17822766bec7) Thanks [@yash-rajpal](https://github.com/yash-rajpal)! - fix: Handle login services errors

### Patch Changes

- [#29202](https://github.com/RocketChat/Rocket.Chat/pull/29202) [`e14ec50816`](https://github.com/RocketChat/Rocket.Chat/commit/e14ec50816ef34ee1df61cb8e824cb2a55ff6db9) Thanks [@hugocostadev](https://github.com/hugocostadev)! - Added and Improved Custom Fields form to Registration Flow

- [#29115](https://github.com/RocketChat/Rocket.Chat/pull/29115) [`ae39f91085`](https://github.com/RocketChat/Rocket.Chat/commit/ae39f91085d463a224970ccfdc70359501049b35) Thanks [@felipe-rod123](https://github.com/felipe-rod123)! - ✅ Added a new email validation in the Registration Form

- [#28999](https://github.com/RocketChat/Rocket.Chat/pull/28999) [`ebbb608166`](https://github.com/RocketChat/Rocket.Chat/commit/ebbb608166b2c069df3397c8f8f48a965bf157af) Thanks [@hugocostadev](https://github.com/hugocostadev)! - fix: Login Terms custom content
  The custom layout Login Terms did not had any effect on the login screen, so it was changed to get the proper setting effect

- [#29420](https://github.com/RocketChat/Rocket.Chat/pull/29420) [`6938bcd1a2`](https://github.com/RocketChat/Rocket.Chat/commit/6938bcd1a293d62a84de6d9f23ed9ee487763b4a) Thanks [@hugocostadev](https://github.com/hugocostadev)! - fix: Manually approved user registration flow
  The new user gets redirected to the login page with a toast message saying:

  > Before you can login, your account must be manually activated by an administrator.

- Updated dependencies [[`e14ec50816`](https://github.com/RocketChat/Rocket.Chat/commit/e14ec50816ef34ee1df61cb8e824cb2a55ff6db9)]:
  - @rocket.chat/ui-contexts@1.0.0
