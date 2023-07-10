# @rocket.chat/meteor

## 6.3.0

### Minor Changes

- [#29490](https://github.com/RocketChat/Rocket.Chat/pull/29490) [`60a7b5cfd4`](https://github.com/RocketChat/Rocket.Chat/commit/60a7b5cfd41e60ad3a8581dd796542acc698d0af) Thanks [@ggazzo](https://github.com/ggazzo)! - feat: Save deprecation usage on prometheus

- [#29203](https://github.com/RocketChat/Rocket.Chat/pull/29203) [`56177021d9`](https://github.com/RocketChat/Rocket.Chat/commit/56177021d918d69913d6bcf531a5fda28675fae1) Thanks [@yash-rajpal](https://github.com/yash-rajpal)! - feat: access-marketplace permission

- [#29500](https://github.com/RocketChat/Rocket.Chat/pull/29500) [`db9e1f6ad7`](https://github.com/RocketChat/Rocket.Chat/commit/db9e1f6ad7c98788eaae8e9abdb0d7b2e7b4c869) Thanks [@ggazzo](https://github.com/ggazzo)! - feat: Add Apps engine Thread Bridge

- [#28783](https://github.com/RocketChat/Rocket.Chat/pull/28783) [`74aa677088`](https://github.com/RocketChat/Rocket.Chat/commit/74aa6770881eb620a2275b84c55465d7552e4597) Thanks [@matheusbsilva137](https://github.com/matheusbsilva137)! - feat: Add custom OAuth setting to allow merging users to others from distinct services

- [#29569](https://github.com/RocketChat/Rocket.Chat/pull/29569) [`47e7a38083`](https://github.com/RocketChat/Rocket.Chat/commit/47e7a38083c4b33cefa9594304ce9473082160b8) Thanks [@dougfabris](https://github.com/dougfabris)! - feat: Quick reactions on message toolbox

- [#29547](https://github.com/RocketChat/Rocket.Chat/pull/29547) [`c1e89b180d`](https://github.com/RocketChat/Rocket.Chat/commit/c1e89b180d58ac1edce8468bd74b118bb832e1d4) Thanks [@ggazzo](https://github.com/ggazzo)! - fix: spotlight doesnt update with new rooms

- [#29727](https://github.com/RocketChat/Rocket.Chat/pull/29727) [`5e387a1b2e`](https://github.com/RocketChat/Rocket.Chat/commit/5e387a1b2e9855e8c8bc2096ac5700da8a7ea9d4) Thanks [@yash-rajpal](https://github.com/yash-rajpal)! - Fix Toggle message box formatting toolbar on click

- [#28975](https://github.com/RocketChat/Rocket.Chat/pull/28975) [`9ea8088f062`](https://github.com/RocketChat/Rocket.Chat/commit/9ea8088f0621900fa7a11156a89f7447482e4df8) Thanks [@yash-rajpal](https://github.com/yash-rajpal)! - fix: respect useEmoji preference for messages

- [#29303](https://github.com/RocketChat/Rocket.Chat/pull/29303) [`35aeeed1cab`](https://github.com/RocketChat/Rocket.Chat/commit/35aeeed1cab7875bb622f4c1a33be743ab7e851e) Thanks [@yash-rajpal](https://github.com/yash-rajpal)! - fix: Hide roomLeader padding

- [#29373](https://github.com/RocketChat/Rocket.Chat/pull/29373) [`3109a764bc`](https://github.com/RocketChat/Rocket.Chat/commit/3109a764bc23f7f1912ed45f1ed6908b89a6d4b0) Thanks [@sampaiodiego](https://github.com/sampaiodiego)! - feat: _Enterprise_ Add support for different transporters to connect multiple monolith instances.

  To use that, you can use the `TRANSPORTER` env var adding "monolith+" to the transporter value. To use NATS for example, your env var should be:

  ```bash
  export TRANSPORTER="monolith+nats://localhost:4222"
  ```

- [#28948](https://github.com/RocketChat/Rocket.Chat/pull/28948) [`6a474ff952f`](https://github.com/RocketChat/Rocket.Chat/commit/6a474ff952fea793aac3db226d13fd9a0bb4f35a) Thanks [@aleksandernsilva](https://github.com/aleksandernsilva)! - Refactored Omnichannel department pages to use best practices, also fixed existing bugs

- [#29697](https://github.com/RocketChat/Rocket.Chat/pull/29697) [`dbdf45b0e5`](https://github.com/RocketChat/Rocket.Chat/commit/dbdf45b0e59c81582274b640c286c8240aa2beda) Thanks [@tiagoevanp](https://github.com/tiagoevanp)! - feat: Introduce contextualBar surface renderer for UiKit blocks

- [#29335](https://github.com/RocketChat/Rocket.Chat/pull/29335) [`cebe359d13`](https://github.com/RocketChat/Rocket.Chat/commit/cebe359d1392c50d7cf8979bdf3e4015544ef97d) Thanks [@yash-rajpal](https://github.com/yash-rajpal)! - fix: Room history scrollbar position

- [#28589](https://github.com/RocketChat/Rocket.Chat/pull/28589) [`5e429d9c78`](https://github.com/RocketChat/Rocket.Chat/commit/5e429d9c78f22cec15d89a4bbf29dd474ecc1b52) Thanks [@matheusbsilva137](https://github.com/matheusbsilva137)! - feat: Add setting to synchronize LDAP info on OAuth logins

- [#29474](https://github.com/RocketChat/Rocket.Chat/pull/29474) [`066cf25f6f`](https://github.com/RocketChat/Rocket.Chat/commit/066cf25f6fa64d3fb77aeade6117dc241410b4ee) Thanks [@yash-rajpal](https://github.com/yash-rajpal)! - Fixed invalid message draft issue.

- [#29255](https://github.com/RocketChat/Rocket.Chat/pull/29255) [`e116d880478`](https://github.com/RocketChat/Rocket.Chat/commit/e116d8804783c91d2f0d1633caea25aeefb67b86) Thanks [@dougfabris](https://github.com/dougfabris)! - chore: Add `roomName` on Composer placeholder

- [#29577](https://github.com/RocketChat/Rocket.Chat/pull/29577) [`7f78a29469`](https://github.com/RocketChat/Rocket.Chat/commit/7f78a2946953464b3795bbec8bf6ecba3b4a3c7e) Thanks [@yash-rajpal](https://github.com/yash-rajpal)! - Fix dates translations

- [#29413](https://github.com/RocketChat/Rocket.Chat/pull/29413) [`c0fa567246`](https://github.com/RocketChat/Rocket.Chat/commit/c0fa567246209cc0b714c3dad67b28c6d14d43b8) Thanks [@tiagoevanp](https://github.com/tiagoevanp)! - Introducing i18n to UiKit text renderers

- [#29263](https://github.com/RocketChat/Rocket.Chat/pull/29263) [`40cebcc0f1c`](https://github.com/RocketChat/Rocket.Chat/commit/40cebcc0f1ce12b0b0d6fdf497b5399930c713bf) Thanks [@ggazzo](https://github.com/ggazzo)! - ask for totp if the provided one is invalid

- [#29302](https://github.com/RocketChat/Rocket.Chat/pull/29302) [`0645f42e12`](https://github.com/RocketChat/Rocket.Chat/commit/0645f42e12b2884bb54db559c4e0b58ac5e69912) Thanks [@dougfabris](https://github.com/dougfabris)! - Reintroduce an user preference to allow users to see all thread messages in the main channel

- [#29282](https://github.com/RocketChat/Rocket.Chat/pull/29282) [`29556cbba9`](https://github.com/RocketChat/Rocket.Chat/commit/29556cbba9dd2cf7112b8ebfc9f9a7a2d819d64f) Thanks [@yash-rajpal](https://github.com/yash-rajpal)! - Added emoji popup trigger length of 3 characters.

- [#29530](https://github.com/RocketChat/Rocket.Chat/pull/29530) [`3de6641573`](https://github.com/RocketChat/Rocket.Chat/commit/3de664157383e9c4202a389602a2fe7c87664c33) Thanks [@yash-rajpal](https://github.com/yash-rajpal)! - Fix message composer popup bug

- [#29336](https://github.com/RocketChat/Rocket.Chat/pull/29336) [`6e2f78feea1`](https://github.com/RocketChat/Rocket.Chat/commit/6e2f78feea1054feb5581d5793a81ddb719585e2) Thanks [@aleksandernsilva](https://github.com/aleksandernsilva)! - Added ability to see attachments in the contact history message list

- [#29546](https://github.com/RocketChat/Rocket.Chat/pull/29546) [`6bce20a39f`](https://github.com/RocketChat/Rocket.Chat/commit/6bce20a39fd17bbdeb1e5b5ea3d2a89aeb33187a) Thanks [@ggazzo](https://github.com/ggazzo)! - fix: Message sent triggering thread subscriptions multiple times

- [#28717](https://github.com/RocketChat/Rocket.Chat/pull/28717) [`c0523e350d`](https://github.com/RocketChat/Rocket.Chat/commit/c0523e350dd4b2e2a2ed57beb8915f8f3573df36) Thanks [@yash-rajpal](https://github.com/yash-rajpal)! - fix: Handle live subscription removal

- [#29579](https://github.com/RocketChat/Rocket.Chat/pull/29579) [`8b2fed74f6`](https://github.com/RocketChat/Rocket.Chat/commit/8b2fed74f65f1f8367b3a10abfbb91141f7ecd47) Thanks [@dougfabris](https://github.com/dougfabris)! - fix: Hide `ComposerPopupUser` hints when composer is compact

- [#29286](https://github.com/RocketChat/Rocket.Chat/pull/29286) [`7e00009ddb2`](https://github.com/RocketChat/Rocket.Chat/commit/7e00009ddb2d23995eacf5b176b0ebc8007e4bb6) Thanks [@anikdhabal](https://github.com/anikdhabal)! - fix: Analytics page crash

### Patch Changes

- [#29418](https://github.com/RocketChat/Rocket.Chat/pull/29418) [`0d00dba7fb`](https://github.com/RocketChat/Rocket.Chat/commit/0d00dba7fb2a9b26c4a292a51a9cd5c9b1aa67a7) Thanks [@Rottenblasters](https://github.com/Rottenblasters)! - Fixed Marketplace Release Info tab loading loop

- [#28367](https://github.com/RocketChat/Rocket.Chat/pull/28367) [`b03fcd9c141`](https://github.com/RocketChat/Rocket.Chat/commit/b03fcd9c14170373e0bd6e44b9b7f369945ffbf2) Thanks [@cauefcr](https://github.com/cauefcr)! - fix: broken error messages on room.saveInfo & missing CF validations on omni/contact api

- [#29253](https://github.com/RocketChat/Rocket.Chat/pull/29253) [`7832a40a6d`](https://github.com/RocketChat/Rocket.Chat/commit/7832a40a6da4b7555aee79261971ccca65da255c) Thanks [@KevLehman](https://github.com/KevLehman)! - refactor: Move units check outside of model for finds

- [#29372](https://github.com/RocketChat/Rocket.Chat/pull/29372) [`ea0bbba8ab`](https://github.com/RocketChat/Rocket.Chat/commit/ea0bbba8abebfa8e0fceac25743b4a9283e223d5) Thanks [@heitortanoue](https://github.com/heitortanoue)! - fixed system messages for room role changes

- [#29455](https://github.com/RocketChat/Rocket.Chat/pull/29455) [`fef33034e4`](https://github.com/RocketChat/Rocket.Chat/commit/fef33034e48ab56b9c0bffda91a66f6aa4fc7177) Thanks [@KevLehman](https://github.com/KevLehman)! - Fixed a problem where the setting `Show Agent Email` from Omnichannel was not being used by the back when returning agent's info

- [#29524](https://github.com/RocketChat/Rocket.Chat/pull/29524) [`8ac0758335`](https://github.com/RocketChat/Rocket.Chat/commit/8ac075833579f0e1429763f1d3ae6b1abc383229) Thanks [@pierre-lehnen-rc](https://github.com/pierre-lehnen-rc)! - fix: Permission to start conference calls was not being considered

- [#29401](https://github.com/RocketChat/Rocket.Chat/pull/29401) [`7d769b96e3`](https://github.com/RocketChat/Rocket.Chat/commit/7d769b96e3d8c56d1beba306805d741377edab6f) Thanks [@matheusbsilva137](https://github.com/matheusbsilva137)! - fix: Importer crashes when sending the "active status" e-mail notification to users

- [#28814](https://github.com/RocketChat/Rocket.Chat/pull/28814) [`222c8ec5bb4`](https://github.com/RocketChat/Rocket.Chat/commit/222c8ec5bb49aa3cd7327d707a957cde592401c6) Thanks [@matheusbsilva137](https://github.com/matheusbsilva137)! - feat: [ENTERPRISE] Add setting to control user merge on LDAP Background Sync

- [#29349](https://github.com/RocketChat/Rocket.Chat/pull/29349) [`c95cda43e69`](https://github.com/RocketChat/Rocket.Chat/commit/c95cda43e69b931cb2c902f9cd031ac064930f6a) Thanks [@ggazzo](https://github.com/ggazzo)! - fix: getActiveLocalUserCount query always returning 0

- [#29245](https://github.com/RocketChat/Rocket.Chat/pull/29245) [`d33f4ebabe`](https://github.com/RocketChat/Rocket.Chat/commit/d33f4ebabee0bc1e49745c8e8ff816a58a3264f6) Thanks [@gabriellsh](https://github.com/gabriellsh)! - fix: OTR session closing after 10 seconds without warning

- [#29202](https://github.com/RocketChat/Rocket.Chat/pull/29202) [`e14ec50816`](https://github.com/RocketChat/Rocket.Chat/commit/e14ec50816ef34ee1df61cb8e824cb2a55ff6db9) Thanks [@hugocostadev](https://github.com/hugocostadev)! - Added and Improved Custom Fields form to Registration Flow

- [#29459](https://github.com/RocketChat/Rocket.Chat/pull/29459) [`fa015f520c`](https://github.com/RocketChat/Rocket.Chat/commit/fa015f520c9ae7b41a6f73e2ad4ecd9db117fc4e) Thanks [@felipe-rod123](https://github.com/felipe-rod123)! - 🛠️ Fixed settings of code input type not wrapping text correctly

- [#29554](https://github.com/RocketChat/Rocket.Chat/pull/29554) [`4187aed60f`](https://github.com/RocketChat/Rocket.Chat/commit/4187aed60f750d1adcdcf83438ed75a171a3e49f) Thanks [@ggazzo](https://github.com/ggazzo)! - regression: asciiart slashcommands breaking client

- [#29675](https://github.com/RocketChat/Rocket.Chat/pull/29675) [`2bdddc5615`](https://github.com/RocketChat/Rocket.Chat/commit/2bdddc5615f4826968fa867368acd82c9e6d3969) Thanks [@KevLehman](https://github.com/KevLehman)! - regression: `onLogin` hook not destructuring user prop

- [#29551](https://github.com/RocketChat/Rocket.Chat/pull/29551) [`afde60c0e4`](https://github.com/RocketChat/Rocket.Chat/commit/afde60c0e46178f1d377b13b438c6c83de9b1290) Thanks [@ggazzo](https://github.com/ggazzo)! - fix: Wrong IP usage on monolith TCP transporter configuration

- [#29174](https://github.com/RocketChat/Rocket.Chat/pull/29174) [`347e2060235`](https://github.com/RocketChat/Rocket.Chat/commit/347e2060235fad8b353294501b54a9db809bfbff) Thanks [@gabriellsh](https://github.com/gabriellsh)! - fix: Clicking uploaded file title replaces current tab

- [#29313](https://github.com/RocketChat/Rocket.Chat/pull/29313) [`c9279bfcd3`](https://github.com/RocketChat/Rocket.Chat/commit/c9279bfcd31e7437719c7dc38b80dea0dee84c47) Thanks [@debdutdeb](https://github.com/debdutdeb)! - fix: message deletion fails if has files attached on filesystem storage

- [#29497](https://github.com/RocketChat/Rocket.Chat/pull/29497) [`f38211af55`](https://github.com/RocketChat/Rocket.Chat/commit/f38211af555b4a6085488b5e406adf7b876cf2e4) Thanks [@heitortanoue](https://github.com/heitortanoue)! - fix: self dm is not found with `im.messages`

- [#29543](https://github.com/RocketChat/Rocket.Chat/pull/29543) [`b837cb9f2a`](https://github.com/RocketChat/Rocket.Chat/commit/b837cb9f2a00979934861818e3f07fe357dc9b70) Thanks [@KevLehman](https://github.com/KevLehman)! - Fixed a problem where disabled department agent's where still being activated when applicable business hours met.

- [#29238](https://github.com/RocketChat/Rocket.Chat/pull/29238) [`0571d34cc0`](https://github.com/RocketChat/Rocket.Chat/commit/0571d34cc03448f0996cb491b01ecef902434f76) Thanks [@Kishn0109](https://github.com/Kishn0109)! - fix: Omnichannel contact table not being updated after add/edit/remove

- [#29493](https://github.com/RocketChat/Rocket.Chat/pull/29493) [`734db1d8bc`](https://github.com/RocketChat/Rocket.Chat/commit/734db1d8bc4a79c7b01f04c931aeb1861954f619) Thanks [@ggazzo](https://github.com/ggazzo)! - fix emoji being rendered as big on headers and other places than message text

- [#29169](https://github.com/RocketChat/Rocket.Chat/pull/29169) [`eecd9fc99a`](https://github.com/RocketChat/Rocket.Chat/commit/eecd9fc99a6a3d7f6156f9c6eaed5db64bba991a) Thanks [@murtaza98](https://github.com/murtaza98)! - fix: Omnichannel Tags available to be used in the wrong department

- [#29250](https://github.com/RocketChat/Rocket.Chat/pull/29250) [`0c34904b502`](https://github.com/RocketChat/Rocket.Chat/commit/0c34904b5024af34d2e0153d29684e0523d08ae6) Thanks [@aleksandernsilva](https://github.com/aleksandernsilva)! - Fixed omnichannel contact form asynchronous validations

- [#29685](https://github.com/RocketChat/Rocket.Chat/pull/29685) [`3e2d70087d`](https://github.com/RocketChat/Rocket.Chat/commit/3e2d70087dcbadae97ff5841da7d912f42b79706) Thanks [@matheusbsilva137](https://github.com/matheusbsilva137)! - fix: Avatar is reset in the UI when username is changed

- [#29228](https://github.com/RocketChat/Rocket.Chat/pull/29228) [`9160c21118`](https://github.com/RocketChat/Rocket.Chat/commit/9160c21118e15ee39a2e83a15e94e939a320a5f7) Thanks [@gabriellsh](https://github.com/gabriellsh)! - fix: Room members list out of order

- [#29293](https://github.com/RocketChat/Rocket.Chat/pull/29293) [`1687bfbe3a6`](https://github.com/RocketChat/Rocket.Chat/commit/1687bfbe3a6af77614e2c20a0ec9c59a218edc66) Thanks [@debdutdeb](https://github.com/debdutdeb)! - fix: Admins unable to create new users if new users require manual approval

- [#28611](https://github.com/RocketChat/Rocket.Chat/pull/28611) [`b31ccd4a96`](https://github.com/RocketChat/Rocket.Chat/commit/b31ccd4a96a62b25e9612f4e1a3ddfd629506df9) Thanks [@felipe-rod123](https://github.com/felipe-rod123)! - chore: break down helpers.ts and create new files

  🔀 changed `handleAPIError` import in AppDetailsPage.tsx
  🔀 changed `apiCurlGetter` import in AppDetailsAPIs.tsx
  🔀 changed `formatPriceAndPurchaseType` import in AppStatusPriceDisplay.tsx

  ❌ deleted `apiCurlGetter, handleInstallError, handleAPIError, warnAppInstall, warnEnableDisableApp, warnStatusChange, formatPriceAndPurchaseType` and moved them to new files, from helpers.ts

  ✅ created apiCurlGetter.ts file
  ✅ created appErroredStatuses.ts file
  ✅ created formatPrice.ts file
  ✅ created formatPriceAndPurchaseType.ts file
  ✅ created formatPricingPlan.ts file
  ✅ created handleAPIError.ts file
  ✅ created handleInstallError.ts file
  ✅ created installApp.ts file
  ✅ created updateApp.ts file
  ✅ created warnAppInstal.ts file
  ✅ created warnEnableDisableApp.ts file
  ✅ created warnStatusChange.ts file

  🔀 changed `handleAPIError` import in useAppInstallationHandler.tsx
  🔀 changed `handleAPIError` import in useCategories.ts
  🔀 changed `handleAPIError` import in useOpenIncompatibleModal.tsx

- [#29718](https://github.com/RocketChat/Rocket.Chat/pull/29718) [`93fff202ee`](https://github.com/RocketChat/Rocket.Chat/commit/93fff202ee031394d7652a00a8d25b651c37db9c) Thanks [@gabriellsh](https://github.com/gabriellsh)! - fixed `room-opened` event not dispatching when navigating cached rooms

- [#29189](https://github.com/RocketChat/Rocket.Chat/pull/29189) [`29452946a5`](https://github.com/RocketChat/Rocket.Chat/commit/29452946a55f093dda7acadd381da4fcb42cf563) Thanks [@KevLehman](https://github.com/KevLehman)! - fix: `queuedForUser` endpoint not filtering by status

- [#29454](https://github.com/RocketChat/Rocket.Chat/pull/29454) [`40d7f7955c`](https://github.com/RocketChat/Rocket.Chat/commit/40d7f7955c930fffe4243715695bd7fca82a254a) Thanks [@gabriellsh](https://github.com/gabriellsh)! - fix(meteor): Scroll position is lost when loading older messages

- [#29625](https://github.com/RocketChat/Rocket.Chat/pull/29625) [`bc115050ae`](https://github.com/RocketChat/Rocket.Chat/commit/bc115050ae44c173871be9fc414142c13dd1ebf9) Thanks [@gabriellsh](https://github.com/gabriellsh)! - fixed a bug with autotranslation encoding text

- [#29649](https://github.com/RocketChat/Rocket.Chat/pull/29649) [`6f3eeec009`](https://github.com/RocketChat/Rocket.Chat/commit/6f3eeec009ef3d233e7b022d9c13bfd2cd3b534b) Thanks [@gabriellsh](https://github.com/gabriellsh)! - fixed video message button disabled on iOS browsers

- [#29395](https://github.com/RocketChat/Rocket.Chat/pull/29395) [`26db142b10`](https://github.com/RocketChat/Rocket.Chat/commit/26db142b100b6886909b107ca578d11da464e823) Thanks [@ggazzo](https://github.com/ggazzo)! - fix wrong %s translations

- [#29584](https://github.com/RocketChat/Rocket.Chat/pull/29584) [`cb5a0f854d`](https://github.com/RocketChat/Rocket.Chat/commit/cb5a0f854da8986e48e81f0195c96ec62f77607e) Thanks [@gabriellsh](https://github.com/gabriellsh)! - fixed a bug where sometimes a room would not load part of its messages.

- [#29591](https://github.com/RocketChat/Rocket.Chat/pull/29591) [`37d653a19c`](https://github.com/RocketChat/Rocket.Chat/commit/37d653a19c7fb31e1cb0e97389591e6c676f1c62) Thanks [@KevLehman](https://github.com/KevLehman)! - Avoid invalid time ranges when adding/editing a Business Hour

- [#29425](https://github.com/RocketChat/Rocket.Chat/pull/29425) [`a7098c8408`](https://github.com/RocketChat/Rocket.Chat/commit/a7098c84088a5fe1be2a97170509fd49fec12132) Thanks [@aleksandernsilva](https://github.com/aleksandernsilva)! - Fixed Omnichannel making an excessive amount of requests to room.info

- [#29587](https://github.com/RocketChat/Rocket.Chat/pull/29587) [`4fb0078aba`](https://github.com/RocketChat/Rocket.Chat/commit/4fb0078aba2a5739cff2cd11421f31c041fb9ec7) Thanks [@yash-rajpal](https://github.com/yash-rajpal)! - fix show badge for thread direct mentions

- [#29549](https://github.com/RocketChat/Rocket.Chat/pull/29549) [`ee5993625b`](https://github.com/RocketChat/Rocket.Chat/commit/ee5993625bb1341e758c6f9ea82ca66c2df03f05) Thanks [@murtaza98](https://github.com/murtaza98)! - fix: Dept w/o any BH config do not adhere to the default BH rules.

- [#28999](https://github.com/RocketChat/Rocket.Chat/pull/28999) [`ebbb608166`](https://github.com/RocketChat/Rocket.Chat/commit/ebbb608166b2c069df3397c8f8f48a965bf157af) Thanks [@hugocostadev](https://github.com/hugocostadev)! - fix: Login Terms custom content
  The custom layout Login Terms did not had any effect on the login screen, so it was changed to get the proper setting effect

- [#29468](https://github.com/RocketChat/Rocket.Chat/pull/29468) [`760c0231ab`](https://github.com/RocketChat/Rocket.Chat/commit/760c0231ab192f523d36c2bcbff0b504620b80af) Thanks [@aleksandernsilva](https://github.com/aleksandernsilva)! - Fixed edit department page showing data from the previous department

- [#28946](https://github.com/RocketChat/Rocket.Chat/pull/28946) [`ae6b825150`](https://github.com/RocketChat/Rocket.Chat/commit/ae6b8251503eb104033051a21a6451f24d7cd400) Thanks [@rique223](https://github.com/rique223)! - Fixed and replaced HTML texts to markdown on Settings to display rich text

- [#29278](https://github.com/RocketChat/Rocket.Chat/pull/29278) [`17024613c52`](https://github.com/RocketChat/Rocket.Chat/commit/17024613c5250fd9a311bd53b623e27bc1001be4) Thanks [@aleksandernsilva](https://github.com/aleksandernsilva)! - fixes the Livechat CSP validation, which was incorrectly blocking access to the widget for all non whitelisted domains

- [#29274](https://github.com/RocketChat/Rocket.Chat/pull/29274) [`b57b2f142d`](https://github.com/RocketChat/Rocket.Chat/commit/b57b2f142dd58d58b068a5bbe9d7698ab4c09ae1) Thanks [@KevLehman](https://github.com/KevLehman)! - refactor: Convert Omnichannel helper ee to ts

- [#28252](https://github.com/RocketChat/Rocket.Chat/pull/28252) [`9da856cc67`](https://github.com/RocketChat/Rocket.Chat/commit/9da856cc67e0264db4c39ce5324f961fa0906779) Thanks [@murtaza98](https://github.com/murtaza98)! - fix: Resume on-hold chat not working with max-chat's allowed per agent config

- [#29523](https://github.com/RocketChat/Rocket.Chat/pull/29523) [`370ee75775`](https://github.com/RocketChat/Rocket.Chat/commit/370ee75775ce99430b7d7865fbdc56b89b7a49b7) Thanks [@aleksandernsilva](https://github.com/aleksandernsilva)! - Re-added pagination to Department's agents list

- [#27121](https://github.com/RocketChat/Rocket.Chat/pull/27121) [`c8cdc517993`](https://github.com/RocketChat/Rocket.Chat/commit/c8cdc5179932c23bc1211eb6df1ae602c2772cc7) Thanks [@debdutdeb](https://github.com/debdutdeb)! - fix: unable to upload files in IOS Safari browsers

- [#29472](https://github.com/RocketChat/Rocket.Chat/pull/29472) [`3e139f206e`](https://github.com/RocketChat/Rocket.Chat/commit/3e139f206e1254a83081a334c33237a8ae9bb23d) Thanks [@debdutdeb](https://github.com/debdutdeb)! - Fixed ENOTFOUND error in k8s deployments

- [#29528](https://github.com/RocketChat/Rocket.Chat/pull/29528) [`0f22271ca2`](https://github.com/RocketChat/Rocket.Chat/commit/0f22271ca23c3c2bc630ac30fbe6ad841289679d) Thanks [@gabriellsh](https://github.com/gabriellsh)! - fixed an issue where the room history is lost when jumping to an older message that is not already loaded

- [#28081](https://github.com/RocketChat/Rocket.Chat/pull/28081) [`3f58495769d`](https://github.com/RocketChat/Rocket.Chat/commit/3f58495769d853a8cee1c4c51161e24350185b0c) Thanks [@LucianoPierdona](https://github.com/LucianoPierdona)! - chore: update room on `cleanRoomHistory` only if any message has been deleted

- [#29128](https://github.com/RocketChat/Rocket.Chat/pull/29128) [`2bcc812fcfa`](https://github.com/RocketChat/Rocket.Chat/commit/2bcc812fcfaa570fb814a1484d02a47c006f8562) Thanks [@ggazzo](https://github.com/ggazzo)! - fix: Rocket.Chat.Apps using wrong id parameter to emit settings

- [#29556](https://github.com/RocketChat/Rocket.Chat/pull/29556) [`0f0b8e17bf`](https://github.com/RocketChat/Rocket.Chat/commit/0f0b8e17bff70942463179b7a57685675b0e5eac) Thanks [@MartinSchoeler](https://github.com/MartinSchoeler)! - fix: hidden custom fields being required in some cases

- [#28989](https://github.com/RocketChat/Rocket.Chat/pull/28989) [`505b292ba90`](https://github.com/RocketChat/Rocket.Chat/commit/505b292ba90a861ad9bd58b3751018d5016612c5) Thanks [@murtaza98](https://github.com/murtaza98)! - test: add missing omnichannel contact-center tests

- [#29529](https://github.com/RocketChat/Rocket.Chat/pull/29529) [`c31f93ed96`](https://github.com/RocketChat/Rocket.Chat/commit/c31f93ed9677e43d947615c5e2ace233c73df7ad) Thanks [@murtaza98](https://github.com/murtaza98)! - fix: newly added agent not following business hours

- [#29019](https://github.com/RocketChat/Rocket.Chat/pull/29019) [`82194555ea4`](https://github.com/RocketChat/Rocket.Chat/commit/82194555ea4569cb1f923f438c87e5cc5e92f072) Thanks [@heitortanoue](https://github.com/heitortanoue)! - fix: Editing a room in the admin menu breaks that room's integration

- [#29421](https://github.com/RocketChat/Rocket.Chat/pull/29421) [`585c49f145`](https://github.com/RocketChat/Rocket.Chat/commit/585c49f1459789badfc68b4592b7da129ca263b9) Thanks [@matheusbsilva137](https://github.com/matheusbsilva137)! - fix: Import progress page stuck at 0%

- [#29323](https://github.com/RocketChat/Rocket.Chat/pull/29323) [`f8cd53bc7e8`](https://github.com/RocketChat/Rocket.Chat/commit/f8cd53bc7e89ab45c8963d65c99c96d87756d91a) Thanks [@KevLehman](https://github.com/KevLehman)! - fix: Add missing awaits to .count() calls

- [#29543](https://github.com/RocketChat/Rocket.Chat/pull/29543) [`b837cb9f2a`](https://github.com/RocketChat/Rocket.Chat/commit/b837cb9f2a00979934861818e3f07fe357dc9b70) Thanks [@KevLehman](https://github.com/KevLehman)! - Fixed logic around Default Business Hours where agents from disabled/archived departments where being omitted from processing at closing time

- [#29578](https://github.com/RocketChat/Rocket.Chat/pull/29578) [`f65781d008`](https://github.com/RocketChat/Rocket.Chat/commit/f65781d00898796d893217d0c9db3cf88cb1ca91) Thanks [@ggazzo](https://github.com/ggazzo)! - fix: Direct message notification

- [#29538](https://github.com/RocketChat/Rocket.Chat/pull/29538) [`9b899959b4`](https://github.com/RocketChat/Rocket.Chat/commit/9b899959b433cfd84c61327b73fcb0ff17fd8ede) Thanks [@AyushKaithwas](https://github.com/AyushKaithwas)! - Fixed Search Shortcut (ctrl + K) and keyboard navigation and selection

- [#26400](https://github.com/RocketChat/Rocket.Chat/pull/26400) [`916c0dcaf2`](https://github.com/RocketChat/Rocket.Chat/commit/916c0dcaf22b2d891d2a257c8dc558f7768d6116) Thanks [@carlosrodrigues94](https://github.com/carlosrodrigues94)! - fix: [ENTERPRISE] Guest users can join more than maxRoomsPerGuest rooms

- [#26875](https://github.com/RocketChat/Rocket.Chat/pull/26875) [`12d97e16c2`](https://github.com/RocketChat/Rocket.Chat/commit/12d97e16c2e12639944d35a4c59c0edba1fb5d2f) Thanks [@LucianoPierdona](https://github.com/LucianoPierdona)! - feat: Allow Incoming Webhooks to override destination channel

- [#29453](https://github.com/RocketChat/Rocket.Chat/pull/29453) [`cb0a92e886`](https://github.com/RocketChat/Rocket.Chat/commit/cb0a92e886d7a1e25bec8d7a45f09ea4bf291ed9) Thanks [@crycode-de](https://github.com/crycode-de)! - fix: Frontend crash if IndexedDB is not available, i.e. in Firefox private mode

- [#29489](https://github.com/RocketChat/Rocket.Chat/pull/29489) [`a685a592a9`](https://github.com/RocketChat/Rocket.Chat/commit/a685a592a9cd73bd9639f9e9d95c5995336637de) Thanks [@ggazzo](https://github.com/ggazzo)! - Fix seats counter including apps

- [#29416](https://github.com/RocketChat/Rocket.Chat/pull/29416) [`4513378600`](https://github.com/RocketChat/Rocket.Chat/commit/45133786008e873a4a5a533958491bccd511aa9a) Thanks [@matheusbsilva137](https://github.com/matheusbsilva137)! - fix: Imported messages are not displayed
  fix: Importer agent is added as a member of every imported room

- [#29636](https://github.com/RocketChat/Rocket.Chat/pull/29636) [`ef107614e5`](https://github.com/RocketChat/Rocket.Chat/commit/ef107614e53b4ba48ca3a5737f402cec824fdabe) Thanks [@aleksandernsilva](https://github.com/aleksandernsilva)! - Fixed Canned Responses text editor having no contrast in dark mode.

- [#29526](https://github.com/RocketChat/Rocket.Chat/pull/29526) [`0fb7d90708`](https://github.com/RocketChat/Rocket.Chat/commit/0fb7d90708ed4f89f74357952550ad6046239252) Thanks [@gabriellsh](https://github.com/gabriellsh)! - fixed an error on mobile ios browser where if you started recording audio and denied permission, it would look like it is still recording

- [#29290](https://github.com/RocketChat/Rocket.Chat/pull/29290) [`ce99be6b0a`](https://github.com/RocketChat/Rocket.Chat/commit/ce99be6b0a7dc2406bc41e1aae24334d1e1a7332) Thanks [@KevLehman](https://github.com/KevLehman)! - fix: Omnichannel queue not running for all queues

- [#29056](https://github.com/RocketChat/Rocket.Chat/pull/29056) [`fc6fb2375b`](https://github.com/RocketChat/Rocket.Chat/commit/fc6fb2375bea0300d0b167e8aa9e51f5e78c11b5) Thanks [@matheusbsilva137](https://github.com/matheusbsilva137)! - fix: Custom OAuth settings are not visible

- [#29589](https://github.com/RocketChat/Rocket.Chat/pull/29589) [`674f95cca9`](https://github.com/RocketChat/Rocket.Chat/commit/674f95cca9a0c63463c03b6994358cb298f46061) Thanks [@KevLehman](https://github.com/KevLehman)! - Avoid updating a user's livechat status on login when its status is set to offline

- [#28912](https://github.com/RocketChat/Rocket.Chat/pull/28912) [`6fe38a487b`](https://github.com/RocketChat/Rocket.Chat/commit/6fe38a487b4547053240366c1678aab50ed5575d) Thanks [@ayush3160](https://github.com/ayush3160)! - Fixed different time formats at different places

- [#28979](https://github.com/RocketChat/Rocket.Chat/pull/28979) [`8fcb3edb40`](https://github.com/RocketChat/Rocket.Chat/commit/8fcb3edb40159cb1d6a7f881d978ee6043d08faf) Thanks [@aleksandernsilva](https://github.com/aleksandernsilva)! - fix: Remove room from UI when another agent takes it

- [#29565](https://github.com/RocketChat/Rocket.Chat/pull/29565) [`65dec98602`](https://github.com/RocketChat/Rocket.Chat/commit/65dec986023b55f04896a9fb4ba48f4a11ea793e) Thanks [@aleksandernsilva](https://github.com/aleksandernsilva)! - Fixed canned responses filter not updating the table as expected

- [#29558](https://github.com/RocketChat/Rocket.Chat/pull/29558) [`f23e4f6cdd`](https://github.com/RocketChat/Rocket.Chat/commit/f23e4f6cdddb94a0a722b2470b9804b84ab83ef9) Thanks [@KevLehman](https://github.com/KevLehman)! - Fixed Business Hours behavior so they now Take seconds in consideration to assess if BH is open/closed

- [#29378](https://github.com/RocketChat/Rocket.Chat/pull/29378) [`059a92e876`](https://github.com/RocketChat/Rocket.Chat/commit/059a92e8769d86cdb40b748895494cb285550afc) Thanks [@KevLehman](https://github.com/KevLehman)! - Fix visitor's query when both email & phone number are empty

- [#28426](https://github.com/RocketChat/Rocket.Chat/pull/28426) [`16dca466ea`](https://github.com/RocketChat/Rocket.Chat/commit/16dca466ea5d79b5f9a5feb68bcb155767bff132) Thanks [@heitortanoue](https://github.com/heitortanoue)! - fix: "Discussions" filter is prioritized in admin "Rooms" page

- Updated dependencies [[`4b5a87c88b1`](https://github.com/RocketChat/Rocket.Chat/commit/4b5a87c88b132c6899ee5023059d17822766bec7), [`7832a40a6d`](https://github.com/RocketChat/Rocket.Chat/commit/7832a40a6da4b7555aee79261971ccca65da255c), [`e14ec50816`](https://github.com/RocketChat/Rocket.Chat/commit/e14ec50816ef34ee1df61cb8e824cb2a55ff6db9), [`74aa677088`](https://github.com/RocketChat/Rocket.Chat/commit/74aa6770881eb620a2275b84c55465d7552e4597), [`e006013e5f`](https://github.com/RocketChat/Rocket.Chat/commit/e006013e5f1f2e795d1594b4c0ac325b600231c0), [`b837cb9f2a`](https://github.com/RocketChat/Rocket.Chat/commit/b837cb9f2a00979934861818e3f07fe357dc9b70), [`eecd9fc99a`](https://github.com/RocketChat/Rocket.Chat/commit/eecd9fc99a6a3d7f6156f9c6eaed5db64bba991a), [`ae39f91085`](https://github.com/RocketChat/Rocket.Chat/commit/ae39f91085d463a224970ccfdc70359501049b35), [`9ea8088f062`](https://github.com/RocketChat/Rocket.Chat/commit/9ea8088f0621900fa7a11156a89f7447482e4df8), [`ee5993625b`](https://github.com/RocketChat/Rocket.Chat/commit/ee5993625bb1341e758c6f9ea82ca66c2df03f05), [`ebbb608166`](https://github.com/RocketChat/Rocket.Chat/commit/ebbb608166b2c069df3397c8f8f48a965bf157af), [`6a474ff952f`](https://github.com/RocketChat/Rocket.Chat/commit/6a474ff952fea793aac3db226d13fd9a0bb4f35a), [`37c792161f`](https://github.com/RocketChat/Rocket.Chat/commit/37c792161f756c712a4203f36a3e056bfb323258), [`9da856cc67`](https://github.com/RocketChat/Rocket.Chat/commit/9da856cc67e0264db4c39ce5324f961fa0906779), [`baaa38f7f4`](https://github.com/RocketChat/Rocket.Chat/commit/baaa38f7f43dcbb47646d1fb3a74aef1d7115b67), [`dbdf45b0e5`](https://github.com/RocketChat/Rocket.Chat/commit/dbdf45b0e59c81582274b640c286c8240aa2beda), [`0f0b8e17bf`](https://github.com/RocketChat/Rocket.Chat/commit/0f0b8e17bff70942463179b7a57685675b0e5eac), [`5e429d9c78`](https://github.com/RocketChat/Rocket.Chat/commit/5e429d9c78f22cec15d89a4bbf29dd474ecc1b52), [`c31f93ed96`](https://github.com/RocketChat/Rocket.Chat/commit/c31f93ed9677e43d947615c5e2ace233c73df7ad), [`6938bcd1a2`](https://github.com/RocketChat/Rocket.Chat/commit/6938bcd1a293d62a84de6d9f23ed9ee487763b4a), [`b837cb9f2a`](https://github.com/RocketChat/Rocket.Chat/commit/b837cb9f2a00979934861818e3f07fe357dc9b70), [`c0fa567246`](https://github.com/RocketChat/Rocket.Chat/commit/c0fa567246209cc0b714c3dad67b28c6d14d43b8), [`40cebcc0f1c`](https://github.com/RocketChat/Rocket.Chat/commit/40cebcc0f1ce12b0b0d6fdf497b5399930c713bf), [`916c0dcaf2`](https://github.com/RocketChat/Rocket.Chat/commit/916c0dcaf22b2d891d2a257c8dc558f7768d6116), [`12d97e16c2`](https://github.com/RocketChat/Rocket.Chat/commit/12d97e16c2e12639944d35a4c59c0edba1fb5d2f), [`40cebcc0f1c`](https://github.com/RocketChat/Rocket.Chat/commit/40cebcc0f1ce12b0b0d6fdf497b5399930c713bf), [`0645f42e12`](https://github.com/RocketChat/Rocket.Chat/commit/0645f42e12b2884bb54db559c4e0b58ac5e69912), [`cde2539619`](https://github.com/RocketChat/Rocket.Chat/commit/cde253961940855cbf94ed10a84ddd1b1b9ff613), [`16dca466ea`](https://github.com/RocketChat/Rocket.Chat/commit/16dca466ea5d79b5f9a5feb68bcb155767bff132)]:
  - @rocket.chat/web-ui-registration@1.0.0
  - @rocket.chat/model-typings@0.0.3
  - @rocket.chat/core-typings@6.3.0
  - @rocket.chat/rest-typings@6.3.0
  - @rocket.chat/ui-client@1.0.0
  - @rocket.chat/ui-contexts@1.0.0
  - @rocket.chat/api-client@0.1.0
  - @rocket.chat/gazzodown@1.0.0
  - @rocket.chat/agenda@0.0.2
  - @rocket.chat/core-services@0.1.0
  - @rocket.chat/fuselage-ui-kit@1.0.0
  - @rocket.chat/omnichannel-services@0.0.3
  - @rocket.chat/models@0.0.3
  - @rocket.chat/pdf-worker@0.0.3
  - @rocket.chat/presence@0.0.3
  - @rocket.chat/cron@0.0.2
  - @rocket.chat/ui-theming@0.0.1
  - @rocket.chat/ui-video-conf@1.0.0
  - @rocket.chat/instance-status@0.0.3

## 6.2.6

### Patch Changes

- [#29545](https://github.com/RocketChat/Rocket.Chat/pull/29545) [`8ade880306`](https://github.com/RocketChat/Rocket.Chat/commit/8ade880306a2f4be6fb979c9db32a1ca5bdf4c1f) Thanks [@github-actions](https://github.com/apps/github-actions)! - fix: Frontend crash if IndexedDB is not available, i.e. in Firefox private mode

- Updated dependencies []:
  - @rocket.chat/core-typings@6.2.6
  - @rocket.chat/rest-typings@6.2.6
  - @rocket.chat/omnichannel-services@0.0.2
  - @rocket.chat/pdf-worker@0.0.2
  - @rocket.chat/presence@0.0.2
  - @rocket.chat/api-client@0.0.2
  - @rocket.chat/core-services@0.0.2
  - @rocket.chat/gazzodown@0.0.1
  - @rocket.chat/model-typings@0.0.2
  - @rocket.chat/ui-contexts@0.0.2
  - @rocket.chat/models@0.0.2
  - @rocket.chat/ui-theming@0.0.1
  - @rocket.chat/fuselage-ui-kit@0.31.16
  - @rocket.chat/ui-client@0.0.1
  - @rocket.chat/ui-video-conf@0.0.1
  - @rocket.chat/web-ui-registration@0.0.1
  - @rocket.chat/instance-status@0.0.2
