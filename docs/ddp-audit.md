# DDP Methods Audit

Generated: 2026-05-22T16:58:48.693Z

| metric | count |
|---|---|
| Registered methods | 189 |
| Used (has caller) | 77 |
| Orphans (no caller) | 112 |
| Used without REST replacement | 52 |
| REST routes scanned | 417 |

## 1. Used methods (77)

| method | registration | callers | REST replacement |
|---|---|---|---|
| `sendMessage` | apps/meteor/app/lib/server/methods/sendMessage.ts:140 | 8 | `chat.sendMessage` |
| `autoTranslate.translateMessage` | apps/meteor/app/autotranslate/server/methods/translateMessage.ts:19 | 2 | `autotranslate.translateMessage` |
| `createDirectMessage` | apps/meteor/server/methods/createDirectMessage.ts:108 | 2 | `im.create` |
| `getRoomByTypeAndName` | apps/meteor/server/publications/room/index.ts:55 | 2 | — none — |
| `joinRoom` | apps/meteor/app/lib/server/methods/joinRoom.ts:18 | 2 | — none — |
| `registerUser` | apps/meteor/server/methods/registerUser.ts:136 | 2 | `users.register` |
| `spotlight` | apps/meteor/server/publications/spotlight.ts:71 | 2 | — none — |
| `userSetUtcOffset` | apps/meteor/server/methods/userSetUtcOffset.ts:15 | 2 | — none — |
| `2fa:checkCodesRemaining` | apps/meteor/app/2fa/server/methods/checkCodesRemaining.ts:12 | 1 | — none — |
| `2fa:disable` | apps/meteor/app/2fa/server/methods/disable.ts:17 | 1 | — none — |
| `2fa:enable` | apps/meteor/app/2fa/server/methods/enable.ts:16 | 1 | — none — |
| `2fa:regenerateCodes` | apps/meteor/app/2fa/server/methods/regenerateCodes.ts:15 | 1 | — none — |
| `2fa:validateTempToken` | apps/meteor/app/2fa/server/methods/validateTempToken.ts:17 | 1 | — none — |
| `UserPresence:away` | apps/meteor/server/methods/userPresence.ts:33 | 1 | — none — |
| `UserPresence:online` | apps/meteor/server/methods/userPresence.ts:26 | 1 | — none — |
| `addOAuthService` | apps/meteor/app/lib/server/methods/addOAuthService.ts:27 | 1 | — none — |
| `addUsersToRoom` | apps/meteor/app/lib/server/methods/addUsersToRoom.ts:125 | 1 | — none — |
| `addWebdavAccount` | apps/meteor/app/webdav/server/methods/addWebdavAccount.ts:82 | 1 | — none — |
| `afterVerifyEmail` | apps/meteor/server/methods/afterVerifyEmail.ts:19 | 1 | — none — |
| `auditGetAuditions` | apps/meteor/ee/server/lib/audit/methods.ts:203 | 1 | — none — |
| `auditGetMessages` | apps/meteor/ee/server/lib/audit/methods.ts:137 | 1 | — none — |
| `auditGetOmnichannelMessages` | apps/meteor/ee/server/lib/audit/methods.ts:90 | 1 | — none — |
| `authorization:addPermissionToRole` | apps/meteor/app/authorization/server/methods/addPermissionToRole.ts:18 | 1 | — none — |
| `authorization:removeRoleFromPermission` | apps/meteor/app/authorization/server/methods/removeRoleFromPermission.ts:17 | 1 | — none — |
| `autoTranslate.getProviderUiMetadata` | apps/meteor/app/autotranslate/server/methods/getProviderUiMetadata.ts:14 | 1 | — none — |
| `autoTranslate.getSupportedLanguages` | apps/meteor/app/autotranslate/server/methods/getSupportedLanguages.ts:17 | 1 | `autotranslate.getSupportedLanguages` |
| `banner/dismiss` | apps/meteor/app/version-check/server/methods/banner_dismiss.ts:16 | 1 | — none — |
| `checkRegistrationSecretURL` | apps/meteor/app/lib/server/methods/checkRegistrationSecretURL.ts:8 | 1 | — none — |
| `clearIntegrationHistory` | apps/meteor/app/integrations/server/methods/clearIntegrationHistory.ts:16 | 1 | — none — |
| `cloud:connectWorkspace` | apps/meteor/app/cloud/server/methods.ts:116 | 1 | — none — |
| `cloud:getWorkspaceRegisterData` | apps/meteor/app/cloud/server/methods.ts:61 | 1 | — none — |
| `cloud:syncWorkspace` | apps/meteor/app/cloud/server/methods.ts:96 | 1 | `cloud.syncWorkspace` |
| `createPrivateGroup` | apps/meteor/app/lib/server/methods/createPrivateGroup.ts:61 | 1 | `groups.create` |
| `deleteCustomSound` | apps/meteor/app/custom-sounds/server/methods/deleteCustomSound.ts:18 | 1 | — none — |
| `deleteFileMessage` | apps/meteor/server/methods/deleteFileMessage.ts:19 | 1 | — none — |
| `e2e.getUsersOfRoomWithoutKey` | apps/meteor/app/e2e/server/methods/getUsersOfRoomWithoutKey.ts:39 | 1 | `e2e.getUsersOfRoomWithoutKey` |
| `e2e.requestSubscriptionKeys` | apps/meteor/app/e2e/server/methods/requestSubscriptionKeys.ts:14 | 1 | — none — |
| `e2e.resetOwnE2EKey` | apps/meteor/app/e2e/server/methods/resetOwnE2EKey.ts:16 | 1 | — none — |
| `e2e.setRoomKeyID` | apps/meteor/app/e2e/server/methods/setRoomKeyID.ts:41 | 1 | `e2e.setRoomKeyID` |
| `executeSlashCommandPreview` | apps/meteor/app/lib/server/methods/executeSlashCommandPreview.ts:56 | 1 | `commands.preview` |
| `getFileFromWebdav` | apps/meteor/app/webdav/server/methods/getFileFromWebdav.ts:18 | 1 | — none — |
| `getMessages` | apps/meteor/app/lib/server/methods/getMessages.ts:18 | 1 | — none — |
| `getReadReceipts` | apps/meteor/ee/server/methods/getReadReceipts.ts:40 | 1 | `chat.getMessageReadReceipts` |
| `getRoomById` | apps/meteor/server/methods/getRoomById.ts:19 | 1 | `rooms.info` |
| `getSetupWizardParameters` | apps/meteor/server/methods/getSetupWizardParameters.ts:20 | 1 | — none — |
| `getSingleMessage` | apps/meteor/app/lib/server/methods/getSingleMessage.ts:32 | 1 | `chat.getMessage` |
| `getSlashCommandPreviews` | apps/meteor/app/lib/server/methods/getSlashCommandPreviews.ts:42 | 1 | `commands.preview` |
| `getThreadMessages` | apps/meteor/app/threads/server/methods/getThreadMessages.ts:22 | 1 | `chat.getThreadMessages` |
| `getWebdavFileList` | apps/meteor/app/webdav/server/methods/getWebdavFileList.ts:18 | 1 | — none — |
| `getWebdavFilePreview` | apps/meteor/app/webdav/server/methods/getWebdavFilePreview.ts:18 | 1 | — none — |
| `leaveRoom` | apps/meteor/app/lib/server/methods/leaveRoom.ts:61 | 1 | — none — |
| `license:getModules` | apps/meteor/ee/app/license/server/methods.ts:26 | 1 | `licenses.info` |
| `license:isEnterprise` | apps/meteor/ee/app/license/server/methods.ts:33 | 1 | — none — |
| `listCustomSounds` | apps/meteor/app/custom-sounds/server/methods/listCustomSounds.ts:14 | 1 | — none — |
| `listCustomUserStatus` | apps/meteor/app/user-status/server/methods/listCustomUserStatus.ts:16 | 1 | `custom-user-status.list` |
| `loadHistory` | apps/meteor/server/methods/loadHistory.ts:33 | 1 | — none — |
| `loadMissedMessages` | apps/meteor/server/methods/loadMissedMessages.ts:18 | 1 | — none — |
| `loadNextMessages` | apps/meteor/server/methods/loadNextMessages.ts:19 | 1 | — none — |
| `loadSurroundingMessages` | apps/meteor/server/methods/loadSurroundingMessages.ts:30 | 1 | — none — |
| `logoutCleanUp` | apps/meteor/server/methods/logoutCleanUp.ts:17 | 1 | — none — |
| `personalAccessTokens:generateToken` | apps/meteor/imports/personal-access-tokens/server/api/methods/generateToken.ts:59 | 1 | `users.generatePersonalAccessToken` |
| `personalAccessTokens:regenerateToken` | apps/meteor/imports/personal-access-tokens/server/api/methods/regenerateToken.ts:48 | 1 | `users.regeneratePersonalAccessToken` |
| `personalAccessTokens:removeToken` | apps/meteor/imports/personal-access-tokens/server/api/methods/removeToken.ts:41 | 1 | `users.removePersonalAccessToken` |
| `readThreads` | apps/meteor/server/methods/readThreads.ts:21 | 1 | — none — |
| `refreshOAuthService` | apps/meteor/app/lib/server/methods/refreshOAuthService.ts:15 | 1 | — none — |
| `removeOAuthService` | apps/meteor/app/lib/server/methods/removeOAuthService.ts:18 | 1 | — none — |
| `replayOutgoingIntegration` | apps/meteor/app/integrations/server/methods/outgoing/replayOutgoingIntegration.ts:17 | 1 | — none — |
| `requestDataDownload` | apps/meteor/server/methods/requestDataDownload.ts:113 | 1 | `users.requestDataDownload` |
| `rocketchatSearch.getProvider` | apps/meteor/app/search/server/methods.ts:27 | 1 | — none — |
| `rocketchatSearch.search` | apps/meteor/app/search/server/methods.ts:50 | 1 | — none — |
| `saveRoomSettings` | apps/meteor/app/channel-settings/server/methods/saveRoomSettings.ts:550 | 1 | `rooms.saveRoomSettings` |
| `saveSettings` | apps/meteor/app/lib/server/methods/saveSettings.ts:48 | 1 | — none — |
| `setAvatarFromService` | apps/meteor/server/methods/setAvatarFromService.ts:17 | 1 | `users.setAvatar` |
| `setUserStatus` | apps/meteor/app/user-status/server/methods/setUserStatus.ts:47 | 1 | `users.setStatus` |
| `slashCommand` | apps/meteor/app/utils/server/slashCommand.ts:143 | 1 | — none — |
| `subscriptions/get` | apps/meteor/server/publications/subscription/index.ts:48 | 1 | `subscriptions.get` |
| `uploadFileToWebdav` | apps/meteor/app/webdav/server/methods/uploadFileToWebdav.ts:25 | 1 | — none — |

## 2. Orphan methods — no caller found (112)

> ⚠️ Detection matches only literal method-name strings. Methods called via dynamic variables (e.g. `useMethod(value)` in admin `MethodActionInput.tsx`) or via the `/v1/method.call/:method` REST proxy will appear orphan.

| method | registration |
|---|---|
| `OAuth.retrieveCredential` | apps/meteor/app/iframe-login/server/iframe_server.ts:36 |
| `OEmbedCacheCleanup` | apps/meteor/server/methods/OEmbedCacheCleanup.ts:24 |
| `UserPresence:setDefaultStatus` | apps/meteor/server/methods/userPresence.ts:18 |
| `addAllUserToRoom` | apps/meteor/server/methods/addAllUserToRoom.ts:88 |
| `addIncomingIntegration` | apps/meteor/app/integrations/server/methods/incoming/addIncomingIntegration.ts:178 |
| `addOutgoingIntegration` | apps/meteor/app/integrations/server/methods/outgoing/addOutgoingIntegration.ts:78 |
| `addRoomLeader` | apps/meteor/server/methods/addRoomLeader.ts:91 |
| `addRoomModerator` | apps/meteor/server/methods/addRoomModerator.ts:113 |
| `addRoomOwner` | apps/meteor/server/methods/addRoomOwner.ts:110 |
| `addSamlService` | apps/meteor/app/meteor-accounts-saml/server/methods/addSamlService.ts:15 |
| `addUserToRoom` | apps/meteor/app/lib/server/methods/addUserToRoom.ts:15 |
| `addWebdavAccountByToken` | apps/meteor/app/webdav/server/methods/addWebdavAccount.ts:145 |
| `archiveRoom` | apps/meteor/app/lib/server/methods/archiveRoom.ts:45 |
| `autoTranslate.saveSettings` | apps/meteor/app/autotranslate/server/methods/saveSettings.ts:15 |
| `blockUser` | apps/meteor/app/lib/server/methods/blockUser.ts:19 |
| `botRequest` | apps/meteor/app/bot-helpers/server/index.ts:208 |
| `browseChannels` | apps/meteor/server/methods/browseChannels.ts:349 |
| `channelsList` | apps/meteor/server/methods/channelsList.ts:23 |
| `checkFederationConfiguration` | apps/meteor/app/lib/server/methods/checkFederationConfiguration.ts:16 |
| `cleanRoomHistory` | apps/meteor/app/lib/server/methods/cleanRoomHistory.ts:70 |
| `cloud:checkRegisterStatus` | apps/meteor/app/cloud/server/methods.ts:43 |
| `cloud:checkUserLoggedIn` | apps/meteor/app/cloud/server/methods.ts:180 |
| `cloud:finishOAuthAuthorization` | apps/meteor/app/cloud/server/methods.ts:159 |
| `cloud:getOAuthAuthorizationUrl` | apps/meteor/app/cloud/server/methods.ts:142 |
| `cloud:logout` | apps/meteor/app/cloud/server/methods.ts:197 |
| `cloud:registerWorkspace` | apps/meteor/app/cloud/server/methods.ts:78 |
| `createChannel` | apps/meteor/app/lib/server/methods/createChannel.ts:63 |
| `createDiscussion` | apps/meteor/app/discussion/server/methods/createDiscussion.ts:250 |
| `crowd_sync_users` | apps/meteor/app/crowd/server/methods.ts:55 |
| `crowd_test_connection` | apps/meteor/app/crowd/server/methods.ts:20 |
| `deleteCustomUserStatus` | apps/meteor/app/user-status/server/methods/deleteCustomUserStatus.ts:33 |
| `deleteEmojiCustom` | apps/meteor/app/emoji-custom/server/methods/deleteEmojiCustom.ts:38 |
| `deleteIncomingIntegration` | apps/meteor/app/integrations/server/methods/incoming/deleteIncomingIntegration.ts:43 |
| `deleteOAuthApp` | apps/meteor/app/oauth2-server-config/server/admin/methods/deleteOAuthApp.ts:37 |
| `deleteOutgoingIntegration` | apps/meteor/app/integrations/server/methods/outgoing/deleteOutgoingIntegration.ts:51 |
| `deleteUser` | apps/meteor/server/methods/deleteUser.ts:49 |
| `deleteUserOwnAccount` | apps/meteor/app/lib/server/methods/deleteUserOwnAccount.ts:66 |
| `downloadPublicImportFile` | apps/meteor/app/importer/server/methods/downloadPublicImportFile.ts:87 |
| `e2e.fetchMyKeys` | apps/meteor/app/e2e/server/methods/fetchMyKeys.ts:15 |
| `e2e.setUserPublicAndPrivateKeys` | apps/meteor/app/e2e/server/methods/setUserPublicAndPrivateKeys.ts:45 |
| `followMessage` | apps/meteor/app/threads/server/methods/followMessage.ts:53 |
| `getChannelHistory` | apps/meteor/app/lib/server/methods/getChannelHistory.ts:158 |
| `getImportFileData` | apps/meteor/app/importer/server/methods/getImportFileData.ts:74 |
| `getImportProgress` | apps/meteor/app/importer/server/methods/getImportProgress.ts:35 |
| `getLatestImportOperations` | apps/meteor/app/importer/server/methods/getLatestImportOperations.ts:29 |
| `getRoomIdByNameOrId` | apps/meteor/server/methods/getRoomIdByNameOrId.ts:18 |
| `getRoomJoinCode` | apps/meteor/app/lib/server/methods/getRoomJoinCode.ts:18 |
| `getRoomNameById` | apps/meteor/server/methods/getRoomNameById.ts:18 |
| `getS3FileUrl` | apps/meteor/app/file-upload/server/methods/getS3FileUrl.ts:19 |
| `getStatistics` | apps/meteor/app/statistics/server/methods/getStatistics.ts:16 |
| `getThreadsList` | apps/meteor/app/threads/server/methods/getThreadsList.ts:20 |
| `getTotalChannels` | apps/meteor/server/methods/getTotalChannels.ts:15 |
| `getUserMentionsByChannel` | apps/meteor/app/mentions/server/methods/getUserMentionsByChannel.ts:41 |
| `getUserStatusText` | apps/meteor/app/user-status/server/methods/getUserStatusText.ts:15 |
| `getUsernameSuggestion` | apps/meteor/app/lib/server/methods/getUsernameSuggestion.ts:15 |
| `getUsersOfRoom` | apps/meteor/server/methods/getUsersOfRoom.ts:29 |
| `hideRoom` | apps/meteor/server/methods/hideRoom.ts:35 |
| `ignoreUser` | apps/meteor/server/methods/ignoreUser.ts:47 |
| `insertOrUpdateEmoji` | apps/meteor/app/emoji-custom/server/methods/insertOrUpdateEmoji.ts:23 |
| `insertOrUpdateSound` | apps/meteor/app/custom-sounds/server/methods/insertOrUpdateSound.ts:30 |
| `insertOrUpdateUserStatus` | apps/meteor/app/user-status/server/methods/insertOrUpdateUserStatus.ts:107 |
| `joinDefaultChannels` | apps/meteor/app/lib/server/methods/joinDefaultChannels.ts:17 |
| `license:getTags` | apps/meteor/ee/app/license/server/methods.ts:29 |
| `license:hasLicense` | apps/meteor/ee/app/license/server/methods.ts:20 |
| `loadLocale` | apps/meteor/server/methods/loadLocale.ts:16 |
| `messageSearch` | apps/meteor/server/methods/messageSearch.ts:90 |
| `messages/get` | apps/meteor/server/publications/messages.ts:277 |
| `openRoom` | apps/meteor/server/methods/openRoom.ts:17 |
| `permissions/get` | apps/meteor/app/authorization/server/streamer/permissions/index.ts:35 |
| `pinMessage` | apps/meteor/app/message-pin/server/pinMessage.ts:201 |
| `private-settings/get` | apps/meteor/server/publications/settings/index.ts:56 |
| `public-settings/get` | apps/meteor/server/publications/settings/index.ts:25 |
| `push_test` | apps/meteor/server/lib/pushConfig.ts:41 |
| `raix:push-update` | apps/meteor/app/push/server/methods.ts:30 |
| `readMessages` | apps/meteor/server/methods/readMessages.ts:19 |
| `removeRoomLeader` | apps/meteor/server/methods/removeRoomLeader.ts:91 |
| `removeRoomModerator` | apps/meteor/server/methods/removeRoomModerator.ts:104 |
| `removeRoomOwner` | apps/meteor/server/methods/removeRoomOwner.ts:109 |
| `removeSlackBridgeChannelLinks` | apps/meteor/app/slackbridge/server/removeChannelLinks.ts:17 |
| `removeUserFromRoom` | apps/meteor/server/methods/removeUserFromRoom.ts:131 |
| `resetAvatar` | apps/meteor/server/methods/resetAvatar.ts:52 |
| `resetIrcConnection` | apps/meteor/app/irc/server/methods/resetIrcConnection.ts:20 |
| `restart_server` | apps/meteor/app/lib/server/methods/restartServer.ts:18 |
| `rocketchatSearch.suggest` | apps/meteor/app/search/server/methods.ts:75 |
| `rooms/get` | apps/meteor/server/publications/room/index.ts:50 |
| `samlLogout` | apps/meteor/app/meteor-accounts-saml/server/methods/samlLogout.ts:37 |
| `saveAudioNotificationValue` | apps/meteor/app/push-notifications/server/methods/saveNotificationSettings.ts:150 |
| `saveNotificationSettings` | apps/meteor/app/push-notifications/server/methods/saveNotificationSettings.ts:135 |
| `saveSetting` | apps/meteor/app/lib/server/methods/saveSetting.ts:23 |
| `saveUserPreferences` | apps/meteor/server/methods/saveUserPreferences.ts:224 |
| `sendFileMessage` | apps/meteor/app/file-upload/server/methods/sendFileMessage.ts:244 |
| `sendForgotPasswordEmail` | apps/meteor/server/methods/sendForgotPasswordEmail.ts:42 |
| `sendMessageLivechat` | apps/meteor/app/livechat/server/methods/sendMessageLivechat.ts:84 |
| `sendSMTPTestEmail` | apps/meteor/app/lib/server/methods/sendSMTPTestEmail.ts:20 |
| `setEmail` | apps/meteor/app/lib/server/methods/setEmail.ts:42 |
| `setRealName` | apps/meteor/app/lib/server/methods/setRealName.ts:18 |
| `setUserActiveStatus` | apps/meteor/server/methods/setUserActiveStatus.ts:37 |
| `starMessage` | apps/meteor/app/message-star/server/starMessage.ts:65 |
| `startImport` | apps/meteor/app/importer/server/methods/startImport.ts:36 |
| `toggleFavorite` | apps/meteor/server/methods/toggleFavorite.ts:33 |
| `unarchiveRoom` | apps/meteor/app/lib/server/methods/unarchiveRoom.ts:40 |
| `unblockUser` | apps/meteor/app/lib/server/methods/unblockUser.ts:17 |
| `unfollowMessage` | apps/meteor/app/threads/server/methods/unfollowMessage.ts:53 |
| `unpinMessage` | apps/meteor/app/message-pin/server/pinMessage.ts:214 |
| `unreadMessages` | apps/meteor/app/message-mark-as-unread/server/unreadMessages.ts:84 |
| `updateIncomingIntegration` | apps/meteor/app/integrations/server/methods/incoming/updateIncomingIntegration.ts:194 |
| `updateMessage` | apps/meteor/app/lib/server/methods/updateMessage.ts:103 |
| `updateOAuthApp` | apps/meteor/app/oauth2-server-config/server/admin/methods/updateOAuthApp.ts:80 |
| `updateOutgoingIntegration` | apps/meteor/app/integrations/server/methods/outgoing/updateOutgoingIntegration.ts:122 |
| `uploadCustomSound` | apps/meteor/app/custom-sounds/server/methods/uploadCustomSound.ts:18 |
| `uploadEmojiCustom` | apps/meteor/app/emoji-custom/server/methods/uploadEmojiCustom.ts:23 |
| `uploadImportFile` | apps/meteor/app/importer/server/methods/uploadImportFile.ts:67 |

## 3. Used methods without REST replacement (52)

| method | registration | callers |
|---|---|---|
| `2fa:checkCodesRemaining` | apps/meteor/app/2fa/server/methods/checkCodesRemaining.ts:12 | 1 |
| `2fa:disable` | apps/meteor/app/2fa/server/methods/disable.ts:17 | 1 |
| `2fa:enable` | apps/meteor/app/2fa/server/methods/enable.ts:16 | 1 |
| `2fa:regenerateCodes` | apps/meteor/app/2fa/server/methods/regenerateCodes.ts:15 | 1 |
| `2fa:validateTempToken` | apps/meteor/app/2fa/server/methods/validateTempToken.ts:17 | 1 |
| `UserPresence:away` | apps/meteor/server/methods/userPresence.ts:33 | 1 |
| `UserPresence:online` | apps/meteor/server/methods/userPresence.ts:26 | 1 |
| `addOAuthService` | apps/meteor/app/lib/server/methods/addOAuthService.ts:27 | 1 |
| `addUsersToRoom` | apps/meteor/app/lib/server/methods/addUsersToRoom.ts:125 | 1 |
| `addWebdavAccount` | apps/meteor/app/webdav/server/methods/addWebdavAccount.ts:82 | 1 |
| `afterVerifyEmail` | apps/meteor/server/methods/afterVerifyEmail.ts:19 | 1 |
| `auditGetAuditions` | apps/meteor/ee/server/lib/audit/methods.ts:203 | 1 |
| `auditGetMessages` | apps/meteor/ee/server/lib/audit/methods.ts:137 | 1 |
| `auditGetOmnichannelMessages` | apps/meteor/ee/server/lib/audit/methods.ts:90 | 1 |
| `authorization:addPermissionToRole` | apps/meteor/app/authorization/server/methods/addPermissionToRole.ts:18 | 1 |
| `authorization:removeRoleFromPermission` | apps/meteor/app/authorization/server/methods/removeRoleFromPermission.ts:17 | 1 |
| `autoTranslate.getProviderUiMetadata` | apps/meteor/app/autotranslate/server/methods/getProviderUiMetadata.ts:14 | 1 |
| `banner/dismiss` | apps/meteor/app/version-check/server/methods/banner_dismiss.ts:16 | 1 |
| `checkRegistrationSecretURL` | apps/meteor/app/lib/server/methods/checkRegistrationSecretURL.ts:8 | 1 |
| `clearIntegrationHistory` | apps/meteor/app/integrations/server/methods/clearIntegrationHistory.ts:16 | 1 |
| `cloud:connectWorkspace` | apps/meteor/app/cloud/server/methods.ts:116 | 1 |
| `cloud:getWorkspaceRegisterData` | apps/meteor/app/cloud/server/methods.ts:61 | 1 |
| `deleteCustomSound` | apps/meteor/app/custom-sounds/server/methods/deleteCustomSound.ts:18 | 1 |
| `deleteFileMessage` | apps/meteor/server/methods/deleteFileMessage.ts:19 | 1 |
| `e2e.requestSubscriptionKeys` | apps/meteor/app/e2e/server/methods/requestSubscriptionKeys.ts:14 | 1 |
| `e2e.resetOwnE2EKey` | apps/meteor/app/e2e/server/methods/resetOwnE2EKey.ts:16 | 1 |
| `getFileFromWebdav` | apps/meteor/app/webdav/server/methods/getFileFromWebdav.ts:18 | 1 |
| `getMessages` | apps/meteor/app/lib/server/methods/getMessages.ts:18 | 1 |
| `getRoomByTypeAndName` | apps/meteor/server/publications/room/index.ts:55 | 2 |
| `getSetupWizardParameters` | apps/meteor/server/methods/getSetupWizardParameters.ts:20 | 1 |
| `getWebdavFileList` | apps/meteor/app/webdav/server/methods/getWebdavFileList.ts:18 | 1 |
| `getWebdavFilePreview` | apps/meteor/app/webdav/server/methods/getWebdavFilePreview.ts:18 | 1 |
| `joinRoom` | apps/meteor/app/lib/server/methods/joinRoom.ts:18 | 2 |
| `leaveRoom` | apps/meteor/app/lib/server/methods/leaveRoom.ts:61 | 1 |
| `license:isEnterprise` | apps/meteor/ee/app/license/server/methods.ts:33 | 1 |
| `listCustomSounds` | apps/meteor/app/custom-sounds/server/methods/listCustomSounds.ts:14 | 1 |
| `loadHistory` | apps/meteor/server/methods/loadHistory.ts:33 | 1 |
| `loadMissedMessages` | apps/meteor/server/methods/loadMissedMessages.ts:18 | 1 |
| `loadNextMessages` | apps/meteor/server/methods/loadNextMessages.ts:19 | 1 |
| `loadSurroundingMessages` | apps/meteor/server/methods/loadSurroundingMessages.ts:30 | 1 |
| `logoutCleanUp` | apps/meteor/server/methods/logoutCleanUp.ts:17 | 1 |
| `readThreads` | apps/meteor/server/methods/readThreads.ts:21 | 1 |
| `refreshOAuthService` | apps/meteor/app/lib/server/methods/refreshOAuthService.ts:15 | 1 |
| `removeOAuthService` | apps/meteor/app/lib/server/methods/removeOAuthService.ts:18 | 1 |
| `replayOutgoingIntegration` | apps/meteor/app/integrations/server/methods/outgoing/replayOutgoingIntegration.ts:17 | 1 |
| `rocketchatSearch.getProvider` | apps/meteor/app/search/server/methods.ts:27 | 1 |
| `rocketchatSearch.search` | apps/meteor/app/search/server/methods.ts:50 | 1 |
| `saveSettings` | apps/meteor/app/lib/server/methods/saveSettings.ts:48 | 1 |
| `slashCommand` | apps/meteor/app/utils/server/slashCommand.ts:143 | 1 |
| `spotlight` | apps/meteor/server/publications/spotlight.ts:71 | 2 |
| `uploadFileToWebdav` | apps/meteor/app/webdav/server/methods/uploadFileToWebdav.ts:25 | 1 |
| `userSetUtcOffset` | apps/meteor/server/methods/userSetUtcOffset.ts:15 | 2 |
