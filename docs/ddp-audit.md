# DDP Methods Audit

Generated: 2026-05-22T15:45:05.731Z

| metric | count |
|---|---|
| Registered methods | 189 |
| Used (has caller) | 75 |
| Orphans (no caller) | 114 |
| Used without REST replacement | 37 |
| REST routes scanned | 383 |

## 1. Used methods (75)

| method | registration | callers | REST replacement |
|---|---|---|---|
| `sendMessage` | apps/meteor/app/lib/server/methods/sendMessage.ts:139 | 8 | `chat.sendMessage` |
| `autoTranslate.translateMessage` | apps/meteor/app/autotranslate/server/methods/translateMessage.ts:18 | 2 | — none — |
| `createDirectMessage` | apps/meteor/server/methods/createDirectMessage.ts:107 | 2 | `im.create` |
| `getRoomByTypeAndName` | apps/meteor/server/publications/room/index.ts:53 | 2 | `rooms.info` |
| `joinRoom` | apps/meteor/app/lib/server/methods/joinRoom.ts:16 | 2 | `channels.join` |
| `registerUser` | apps/meteor/server/methods/registerUser.ts:135 | 2 | `users.register` |
| `spotlight` | apps/meteor/server/publications/spotlight.ts:70 | 2 | `spotlight` |
| `userSetUtcOffset` | apps/meteor/server/methods/userSetUtcOffset.ts:15 | 2 | — none — |
| `2fa:checkCodesRemaining` | apps/meteor/app/2fa/server/methods/checkCodesRemaining.ts:12 | 1 | — none — |
| `2fa:disable` | apps/meteor/app/2fa/server/methods/disable.ts:16 | 1 | `users.2fa.sendEmailCode` |
| `2fa:enable` | apps/meteor/app/2fa/server/methods/enable.ts:15 | 1 | `users.2fa.enableEmail` |
| `2fa:regenerateCodes` | apps/meteor/app/2fa/server/methods/regenerateCodes.ts:15 | 1 | — none — |
| `2fa:validateTempToken` | apps/meteor/app/2fa/server/methods/validateTempToken.ts:17 | 1 | — none — |
| `UserPresence:away` | apps/meteor/server/methods/userPresence.ts:30 | 1 | — none — |
| `UserPresence:online` | apps/meteor/server/methods/userPresence.ts:23 | 1 | — none — |
| `addOAuthService` | apps/meteor/app/lib/server/methods/addOAuthService.ts:27 | 1 | — none — |
| `addUsersToRoom` | apps/meteor/app/lib/server/methods/addUsersToRoom.ts:124 | 1 | `channels.invite` |
| `addWebdavAccount` | apps/meteor/app/webdav/server/methods/addWebdavAccount.ts:81 | 1 | — none — |
| `afterVerifyEmail` | apps/meteor/server/methods/afterVerifyEmail.ts:19 | 1 | — none — |
| `auditGetAuditions` | apps/meteor/ee/server/lib/audit/methods.ts:203 | 1 | — none — |
| `auditGetMessages` | apps/meteor/ee/server/lib/audit/methods.ts:137 | 1 | — none — |
| `auditGetOmnichannelMessages` | apps/meteor/ee/server/lib/audit/methods.ts:90 | 1 | — none — |
| `authorization:addPermissionToRole` | apps/meteor/app/authorization/server/methods/addPermissionToRole.ts:18 | 1 | — none — |
| `authorization:removeRoleFromPermission` | apps/meteor/app/authorization/server/methods/removeRoleFromPermission.ts:17 | 1 | — none — |
| `autoTranslate.getProviderUiMetadata` | apps/meteor/app/autotranslate/server/methods/getProviderUiMetadata.ts:14 | 1 | — none — |
| `autoTranslate.getSupportedLanguages` | apps/meteor/app/autotranslate/server/methods/getSupportedLanguages.ts:16 | 1 | — none — |
| `banner/dismiss` | apps/meteor/app/version-check/server/methods/banner_dismiss.ts:15 | 1 | `banners.dismiss` |
| `checkRegistrationSecretURL` | apps/meteor/app/lib/server/methods/checkRegistrationSecretURL.ts:8 | 1 | — none — |
| `clearIntegrationHistory` | apps/meteor/app/integrations/server/methods/clearIntegrationHistory.ts:16 | 1 | — none — |
| `cloud:connectWorkspace` | apps/meteor/app/cloud/server/methods.ts:112 | 1 | — none — |
| `cloud:getWorkspaceRegisterData` | apps/meteor/app/cloud/server/methods.ts:59 | 1 | — none — |
| `cloud:syncWorkspace` | apps/meteor/app/cloud/server/methods.ts:93 | 1 | `cloud.syncWorkspace` |
| `createPrivateGroup` | apps/meteor/app/lib/server/methods/createPrivateGroup.ts:60 | 1 | `groups.create` |
| `deleteCustomSound` | apps/meteor/app/custom-sounds/server/methods/deleteCustomSound.ts:18 | 1 | — none — |
| `deleteFileMessage` | apps/meteor/server/methods/deleteFileMessage.ts:18 | 1 | `rooms.cleanHistory` |
| `e2e.getUsersOfRoomWithoutKey` | apps/meteor/app/e2e/server/methods/getUsersOfRoomWithoutKey.ts:38 | 1 | `e2e.getUsersOfRoomWithoutKey` |
| `e2e.requestSubscriptionKeys` | apps/meteor/app/e2e/server/methods/requestSubscriptionKeys.ts:14 | 1 | — none — |
| `e2e.resetOwnE2EKey` | apps/meteor/app/e2e/server/methods/resetOwnE2EKey.ts:16 | 1 | — none — |
| `e2e.setRoomKeyID` | apps/meteor/app/e2e/server/methods/setRoomKeyID.ts:40 | 1 | `e2e.setRoomKeyID` |
| `executeSlashCommandPreview` | apps/meteor/app/lib/server/methods/executeSlashCommandPreview.ts:55 | 1 | `commands.preview` |
| `getFileFromWebdav` | apps/meteor/app/webdav/server/methods/getFileFromWebdav.ts:18 | 1 | — none — |
| `getMessages` | apps/meteor/app/lib/server/methods/getMessages.ts:17 | 1 | `chat.getMessage` |
| `getReadReceipts` | apps/meteor/ee/server/methods/getReadReceipts.ts:39 | 1 | — none — |
| `getRoomById` | apps/meteor/server/methods/getRoomById.ts:18 | 1 | `rooms.info` |
| `getSetupWizardParameters` | apps/meteor/server/methods/getSetupWizardParameters.ts:19 | 1 | `settings.public` |
| `getSingleMessage` | apps/meteor/app/lib/server/methods/getSingleMessage.ts:31 | 1 | `chat.getMessage` |
| `getSlashCommandPreviews` | apps/meteor/app/lib/server/methods/getSlashCommandPreviews.ts:41 | 1 | `commands.preview` |
| `getThreadMessages` | apps/meteor/app/threads/server/methods/getThreadMessages.ts:21 | 1 | `chat.getThreadMessages` |
| `getWebdavFileList` | apps/meteor/app/webdav/server/methods/getWebdavFileList.ts:18 | 1 | — none — |
| `getWebdavFilePreview` | apps/meteor/app/webdav/server/methods/getWebdavFilePreview.ts:18 | 1 | — none — |
| `leaveRoom` | apps/meteor/app/lib/server/methods/leaveRoom.ts:60 | 1 | `channels.leave` |
| `license:getModules` | apps/meteor/ee/app/license/server/methods.ts:23 | 1 | — none — |
| `license:isEnterprise` | apps/meteor/ee/app/license/server/methods.ts:29 | 1 | — none — |
| `listCustomSounds` | apps/meteor/app/custom-sounds/server/methods/listCustomSounds.ts:14 | 1 | — none — |
| `listCustomUserStatus` | apps/meteor/app/user-status/server/methods/listCustomUserStatus.ts:14 | 1 | `custom-user-status.list` |
| `loadHistory` | apps/meteor/server/methods/loadHistory.ts:32 | 1 | `channels.history` |
| `loadMissedMessages` | apps/meteor/server/methods/loadMissedMessages.ts:17 | 1 | `chat.syncMessages` |
| `loadNextMessages` | apps/meteor/server/methods/loadNextMessages.ts:18 | 1 | `chat.syncMessages` |
| `loadSurroundingMessages` | apps/meteor/server/methods/loadSurroundingMessages.ts:29 | 1 | `chat.syncMessages` |
| `logoutCleanUp` | apps/meteor/server/methods/logoutCleanUp.ts:17 | 1 | — none — |
| `personalAccessTokens:generateToken` | apps/meteor/imports/personal-access-tokens/server/api/methods/generateToken.ts:58 | 1 | `users.generatePersonalAccessToken` |
| `personalAccessTokens:regenerateToken` | apps/meteor/imports/personal-access-tokens/server/api/methods/regenerateToken.ts:47 | 1 | `users.regeneratePersonalAccessToken` |
| `personalAccessTokens:removeToken` | apps/meteor/imports/personal-access-tokens/server/api/methods/removeToken.ts:40 | 1 | `users.removePersonalAccessToken` |
| `readThreads` | apps/meteor/server/methods/readThreads.ts:20 | 1 | `subscriptions.read` |
| `refreshOAuthService` | apps/meteor/app/lib/server/methods/refreshOAuthService.ts:15 | 1 | — none — |
| `removeOAuthService` | apps/meteor/app/lib/server/methods/removeOAuthService.ts:18 | 1 | — none — |
| `replayOutgoingIntegration` | apps/meteor/app/integrations/server/methods/outgoing/replayOutgoingIntegration.ts:17 | 1 | — none — |
| `requestDataDownload` | apps/meteor/server/methods/requestDataDownload.ts:112 | 1 | `users.requestDataDownload` |
| `saveRoomSettings` | apps/meteor/app/channel-settings/server/methods/saveRoomSettings.ts:549 | 1 | `rooms.saveRoomSettings` |
| `saveSettings` | apps/meteor/app/lib/server/methods/saveSettings.ts:47 | 1 | `settings` |
| `setAvatarFromService` | apps/meteor/server/methods/setAvatarFromService.ts:16 | 1 | `users.setAvatar` |
| `setUserStatus` | apps/meteor/app/user-status/server/methods/setUserStatus.ts:46 | 1 | `users.setStatus` |
| `slashCommand` | apps/meteor/app/utils/server/slashCommand.ts:141 | 1 | `commands.run` |
| `subscriptions/get` | apps/meteor/server/publications/subscription/index.ts:47 | 1 | — none — |
| `uploadFileToWebdav` | apps/meteor/app/webdav/server/methods/uploadFileToWebdav.ts:25 | 1 | — none — |

## 2. Orphan methods — no caller found (114)

> ⚠️ Detection matches only literal method-name strings. Methods called via dynamic variables (e.g. `useMethod(value)` in admin `MethodActionInput.tsx`) or via the `/v1/method.call/:method` REST proxy will appear orphan.

| method | registration |
|---|---|
| `OAuth.retrieveCredential` | apps/meteor/app/iframe-login/server/iframe_server.ts:34 |
| `OEmbedCacheCleanup` | apps/meteor/server/methods/OEmbedCacheCleanup.ts:23 |
| `UserPresence:setDefaultStatus` | apps/meteor/server/methods/userPresence.ts:16 |
| `addAllUserToRoom` | apps/meteor/server/methods/addAllUserToRoom.ts:87 |
| `addIncomingIntegration` | apps/meteor/app/integrations/server/methods/incoming/addIncomingIntegration.ts:177 |
| `addOutgoingIntegration` | apps/meteor/app/integrations/server/methods/outgoing/addOutgoingIntegration.ts:77 |
| `addRoomLeader` | apps/meteor/server/methods/addRoomLeader.ts:90 |
| `addRoomModerator` | apps/meteor/server/methods/addRoomModerator.ts:112 |
| `addRoomOwner` | apps/meteor/server/methods/addRoomOwner.ts:109 |
| `addSamlService` | apps/meteor/app/meteor-accounts-saml/server/methods/addSamlService.ts:14 |
| `addUserToRoom` | apps/meteor/app/lib/server/methods/addUserToRoom.ts:14 |
| `addWebdavAccountByToken` | apps/meteor/app/webdav/server/methods/addWebdavAccount.ts:144 |
| `archiveRoom` | apps/meteor/app/lib/server/methods/archiveRoom.ts:44 |
| `autoTranslate.saveSettings` | apps/meteor/app/autotranslate/server/methods/saveSettings.ts:14 |
| `blockUser` | apps/meteor/app/lib/server/methods/blockUser.ts:18 |
| `botRequest` | apps/meteor/app/bot-helpers/server/index.ts:207 |
| `browseChannels` | apps/meteor/server/methods/browseChannels.ts:348 |
| `channelsList` | apps/meteor/server/methods/channelsList.ts:22 |
| `checkFederationConfiguration` | apps/meteor/app/lib/server/methods/checkFederationConfiguration.ts:14 |
| `cleanRoomHistory` | apps/meteor/app/lib/server/methods/cleanRoomHistory.ts:69 |
| `cloud:checkRegisterStatus` | apps/meteor/app/cloud/server/methods.ts:42 |
| `cloud:checkUserLoggedIn` | apps/meteor/app/cloud/server/methods.ts:174 |
| `cloud:finishOAuthAuthorization` | apps/meteor/app/cloud/server/methods.ts:154 |
| `cloud:getOAuthAuthorizationUrl` | apps/meteor/app/cloud/server/methods.ts:138 |
| `cloud:logout` | apps/meteor/app/cloud/server/methods.ts:190 |
| `cloud:registerWorkspace` | apps/meteor/app/cloud/server/methods.ts:76 |
| `context` | apps/meteor/app/search/server/methods.ts:46 |
| `createChannel` | apps/meteor/app/lib/server/methods/createChannel.ts:62 |
| `createDiscussion` | apps/meteor/app/discussion/server/methods/createDiscussion.ts:249 |
| `crowd_sync_users` | apps/meteor/app/crowd/server/methods.ts:53 |
| `crowd_test_connection` | apps/meteor/app/crowd/server/methods.ts:19 |
| `deleteCustomUserStatus` | apps/meteor/app/user-status/server/methods/deleteCustomUserStatus.ts:32 |
| `deleteEmojiCustom` | apps/meteor/app/emoji-custom/server/methods/deleteEmojiCustom.ts:37 |
| `deleteIncomingIntegration` | apps/meteor/app/integrations/server/methods/incoming/deleteIncomingIntegration.ts:42 |
| `deleteOAuthApp` | apps/meteor/app/oauth2-server-config/server/admin/methods/deleteOAuthApp.ts:36 |
| `deleteOutgoingIntegration` | apps/meteor/app/integrations/server/methods/outgoing/deleteOutgoingIntegration.ts:50 |
| `deleteUser` | apps/meteor/server/methods/deleteUser.ts:48 |
| `deleteUserOwnAccount` | apps/meteor/app/lib/server/methods/deleteUserOwnAccount.ts:65 |
| `downloadPublicImportFile` | apps/meteor/app/importer/server/methods/downloadPublicImportFile.ts:86 |
| `e2e.fetchMyKeys` | apps/meteor/app/e2e/server/methods/fetchMyKeys.ts:13 |
| `e2e.setUserPublicAndPrivateKeys` | apps/meteor/app/e2e/server/methods/setUserPublicAndPrivateKeys.ts:44 |
| `followMessage` | apps/meteor/app/threads/server/methods/followMessage.ts:52 |
| `getChannelHistory` | apps/meteor/app/lib/server/methods/getChannelHistory.ts:157 |
| `getImportFileData` | apps/meteor/app/importer/server/methods/getImportFileData.ts:73 |
| `getImportProgress` | apps/meteor/app/importer/server/methods/getImportProgress.ts:34 |
| `getLatestImportOperations` | apps/meteor/app/importer/server/methods/getLatestImportOperations.ts:28 |
| `getRoomIdByNameOrId` | apps/meteor/server/methods/getRoomIdByNameOrId.ts:17 |
| `getRoomJoinCode` | apps/meteor/app/lib/server/methods/getRoomJoinCode.ts:17 |
| `getRoomNameById` | apps/meteor/server/methods/getRoomNameById.ts:17 |
| `getS3FileUrl` | apps/meteor/app/file-upload/server/methods/getS3FileUrl.ts:18 |
| `getStatistics` | apps/meteor/app/statistics/server/methods/getStatistics.ts:15 |
| `getThreadsList` | apps/meteor/app/threads/server/methods/getThreadsList.ts:19 |
| `getTotalChannels` | apps/meteor/server/methods/getTotalChannels.ts:13 |
| `getUserMentionsByChannel` | apps/meteor/app/mentions/server/methods/getUserMentionsByChannel.ts:40 |
| `getUserStatusText` | apps/meteor/app/user-status/server/methods/getUserStatusText.ts:14 |
| `getUsernameSuggestion` | apps/meteor/app/lib/server/methods/getUsernameSuggestion.ts:14 |
| `getUsersOfRoom` | apps/meteor/server/methods/getUsersOfRoom.ts:28 |
| `hideRoom` | apps/meteor/server/methods/hideRoom.ts:34 |
| `ignoreUser` | apps/meteor/server/methods/ignoreUser.ts:46 |
| `insertOrUpdateEmoji` | apps/meteor/app/emoji-custom/server/methods/insertOrUpdateEmoji.ts:22 |
| `insertOrUpdateSound` | apps/meteor/app/custom-sounds/server/methods/insertOrUpdateSound.ts:30 |
| `insertOrUpdateUserStatus` | apps/meteor/app/user-status/server/methods/insertOrUpdateUserStatus.ts:106 |
| `joinDefaultChannels` | apps/meteor/app/lib/server/methods/joinDefaultChannels.ts:16 |
| `license:getTags` | apps/meteor/ee/app/license/server/methods.ts:26 |
| `license:hasLicense` | apps/meteor/ee/app/license/server/methods.ts:18 |
| `loadLocale` | apps/meteor/server/methods/loadLocale.ts:15 |
| `messageSearch` | apps/meteor/server/methods/messageSearch.ts:89 |
| `messages/get` | apps/meteor/server/publications/messages.ts:276 |
| `openRoom` | apps/meteor/server/methods/openRoom.ts:16 |
| `permissions/get` | apps/meteor/app/authorization/server/streamer/permissions/index.ts:33 |
| `pinMessage` | apps/meteor/app/message-pin/server/pinMessage.ts:200 |
| `private-settings/get` | apps/meteor/server/publications/settings/index.ts:54 |
| `public-settings/get` | apps/meteor/server/publications/settings/index.ts:24 |
| `push_test` | apps/meteor/server/lib/pushConfig.ts:40 |
| `raix:push-update` | apps/meteor/app/push/server/methods.ts:29 |
| `readMessages` | apps/meteor/server/methods/readMessages.ts:18 |
| `removeRoomLeader` | apps/meteor/server/methods/removeRoomLeader.ts:90 |
| `removeRoomModerator` | apps/meteor/server/methods/removeRoomModerator.ts:103 |
| `removeRoomOwner` | apps/meteor/server/methods/removeRoomOwner.ts:108 |
| `removeSlackBridgeChannelLinks` | apps/meteor/app/slackbridge/server/removeChannelLinks.ts:16 |
| `removeUserFromRoom` | apps/meteor/server/methods/removeUserFromRoom.ts:130 |
| `resetAvatar` | apps/meteor/server/methods/resetAvatar.ts:51 |
| `resetIrcConnection` | apps/meteor/app/irc/server/methods/resetIrcConnection.ts:19 |
| `restart_server` | apps/meteor/app/lib/server/methods/restartServer.ts:17 |
| `rocketchatSearch.suggest` | apps/meteor/app/search/server/methods.ts:74 |
| `rooms/get` | apps/meteor/server/publications/room/index.ts:49 |
| `samlLogout` | apps/meteor/app/meteor-accounts-saml/server/methods/samlLogout.ts:36 |
| `saveAudioNotificationValue` | apps/meteor/app/push-notifications/server/methods/saveNotificationSettings.ts:148 |
| `saveNotificationSettings` | apps/meteor/app/push-notifications/server/methods/saveNotificationSettings.ts:134 |
| `saveSetting` | apps/meteor/app/lib/server/methods/saveSetting.ts:22 |
| `saveUserPreferences` | apps/meteor/server/methods/saveUserPreferences.ts:223 |
| `sendFileMessage` | apps/meteor/app/file-upload/server/methods/sendFileMessage.ts:244 |
| `sendForgotPasswordEmail` | apps/meteor/server/methods/sendForgotPasswordEmail.ts:41 |
| `sendMessageLivechat` | apps/meteor/app/livechat/server/methods/sendMessageLivechat.ts:83 |
| `sendSMTPTestEmail` | apps/meteor/app/lib/server/methods/sendSMTPTestEmail.ts:19 |
| `setEmail` | apps/meteor/app/lib/server/methods/setEmail.ts:41 |
| `setRealName` | apps/meteor/app/lib/server/methods/setRealName.ts:17 |
| `setUserActiveStatus` | apps/meteor/server/methods/setUserActiveStatus.ts:36 |
| `settings` | apps/meteor/app/search/server/methods.ts:24 |
| `starMessage` | apps/meteor/app/message-star/server/starMessage.ts:65 |
| `startImport` | apps/meteor/app/importer/server/methods/startImport.ts:35 |
| `toggleFavorite` | apps/meteor/server/methods/toggleFavorite.ts:32 |
| `unarchiveRoom` | apps/meteor/app/lib/server/methods/unarchiveRoom.ts:39 |
| `unblockUser` | apps/meteor/app/lib/server/methods/unblockUser.ts:16 |
| `unfollowMessage` | apps/meteor/app/threads/server/methods/unfollowMessage.ts:52 |
| `unpinMessage` | apps/meteor/app/message-pin/server/pinMessage.ts:212 |
| `unreadMessages` | apps/meteor/app/message-mark-as-unread/server/unreadMessages.ts:83 |
| `updateIncomingIntegration` | apps/meteor/app/integrations/server/methods/incoming/updateIncomingIntegration.ts:193 |
| `updateMessage` | apps/meteor/app/lib/server/methods/updateMessage.ts:102 |
| `updateOAuthApp` | apps/meteor/app/oauth2-server-config/server/admin/methods/updateOAuthApp.ts:79 |
| `updateOutgoingIntegration` | apps/meteor/app/integrations/server/methods/outgoing/updateOutgoingIntegration.ts:121 |
| `uploadCustomSound` | apps/meteor/app/custom-sounds/server/methods/uploadCustomSound.ts:18 |
| `uploadEmojiCustom` | apps/meteor/app/emoji-custom/server/methods/uploadEmojiCustom.ts:22 |
| `uploadImportFile` | apps/meteor/app/importer/server/methods/uploadImportFile.ts:66 |

## 3. Used methods without REST replacement (37)

| method | registration | callers |
|---|---|---|
| `2fa:checkCodesRemaining` | apps/meteor/app/2fa/server/methods/checkCodesRemaining.ts:12 | 1 |
| `2fa:regenerateCodes` | apps/meteor/app/2fa/server/methods/regenerateCodes.ts:15 | 1 |
| `2fa:validateTempToken` | apps/meteor/app/2fa/server/methods/validateTempToken.ts:17 | 1 |
| `UserPresence:away` | apps/meteor/server/methods/userPresence.ts:30 | 1 |
| `UserPresence:online` | apps/meteor/server/methods/userPresence.ts:23 | 1 |
| `addOAuthService` | apps/meteor/app/lib/server/methods/addOAuthService.ts:27 | 1 |
| `addWebdavAccount` | apps/meteor/app/webdav/server/methods/addWebdavAccount.ts:81 | 1 |
| `afterVerifyEmail` | apps/meteor/server/methods/afterVerifyEmail.ts:19 | 1 |
| `auditGetAuditions` | apps/meteor/ee/server/lib/audit/methods.ts:203 | 1 |
| `auditGetMessages` | apps/meteor/ee/server/lib/audit/methods.ts:137 | 1 |
| `auditGetOmnichannelMessages` | apps/meteor/ee/server/lib/audit/methods.ts:90 | 1 |
| `authorization:addPermissionToRole` | apps/meteor/app/authorization/server/methods/addPermissionToRole.ts:18 | 1 |
| `authorization:removeRoleFromPermission` | apps/meteor/app/authorization/server/methods/removeRoleFromPermission.ts:17 | 1 |
| `autoTranslate.getProviderUiMetadata` | apps/meteor/app/autotranslate/server/methods/getProviderUiMetadata.ts:14 | 1 |
| `autoTranslate.getSupportedLanguages` | apps/meteor/app/autotranslate/server/methods/getSupportedLanguages.ts:16 | 1 |
| `autoTranslate.translateMessage` | apps/meteor/app/autotranslate/server/methods/translateMessage.ts:18 | 2 |
| `checkRegistrationSecretURL` | apps/meteor/app/lib/server/methods/checkRegistrationSecretURL.ts:8 | 1 |
| `clearIntegrationHistory` | apps/meteor/app/integrations/server/methods/clearIntegrationHistory.ts:16 | 1 |
| `cloud:connectWorkspace` | apps/meteor/app/cloud/server/methods.ts:112 | 1 |
| `cloud:getWorkspaceRegisterData` | apps/meteor/app/cloud/server/methods.ts:59 | 1 |
| `deleteCustomSound` | apps/meteor/app/custom-sounds/server/methods/deleteCustomSound.ts:18 | 1 |
| `e2e.requestSubscriptionKeys` | apps/meteor/app/e2e/server/methods/requestSubscriptionKeys.ts:14 | 1 |
| `e2e.resetOwnE2EKey` | apps/meteor/app/e2e/server/methods/resetOwnE2EKey.ts:16 | 1 |
| `getFileFromWebdav` | apps/meteor/app/webdav/server/methods/getFileFromWebdav.ts:18 | 1 |
| `getReadReceipts` | apps/meteor/ee/server/methods/getReadReceipts.ts:39 | 1 |
| `getWebdavFileList` | apps/meteor/app/webdav/server/methods/getWebdavFileList.ts:18 | 1 |
| `getWebdavFilePreview` | apps/meteor/app/webdav/server/methods/getWebdavFilePreview.ts:18 | 1 |
| `license:getModules` | apps/meteor/ee/app/license/server/methods.ts:23 | 1 |
| `license:isEnterprise` | apps/meteor/ee/app/license/server/methods.ts:29 | 1 |
| `listCustomSounds` | apps/meteor/app/custom-sounds/server/methods/listCustomSounds.ts:14 | 1 |
| `logoutCleanUp` | apps/meteor/server/methods/logoutCleanUp.ts:17 | 1 |
| `refreshOAuthService` | apps/meteor/app/lib/server/methods/refreshOAuthService.ts:15 | 1 |
| `removeOAuthService` | apps/meteor/app/lib/server/methods/removeOAuthService.ts:18 | 1 |
| `replayOutgoingIntegration` | apps/meteor/app/integrations/server/methods/outgoing/replayOutgoingIntegration.ts:17 | 1 |
| `subscriptions/get` | apps/meteor/server/publications/subscription/index.ts:47 | 1 |
| `uploadFileToWebdav` | apps/meteor/app/webdav/server/methods/uploadFileToWebdav.ts:25 | 1 |
| `userSetUtcOffset` | apps/meteor/server/methods/userSetUtcOffset.ts:15 | 2 |
