import { commonUtils, roomCommonUtils, userCommonUtils } from './factory';

export { t, isRtl } from '../lib/tapi18n';
export { getDefaultSubscriptionPref } from '../lib/getDefaultSubscriptionPref';
export { Info } from '../rocketchat.info';
export { fileUploadMediaWhiteList, fileUploadIsValidContentType } from '../lib/fileUploadRestrictions';
export { roomTypes } from './lib/roomTypes';
export { RoomTypeRouteConfig, RoomTypeConfig, RoomSettingsEnum, RoomMemberActions, UiTextContext } from '../lib/RoomTypeConfig';
export { RoomTypesCommon } from '../lib/RoomTypesCommon';
export { isDocker } from './functions/isDocker';
export { getMongoInfo, getOplogInfo } from './functions/getMongoInfo';
export { slashCommands } from '../lib/slashCommand';
export { getUserNotificationPreference } from '../lib/getUserNotificationPreference';
export { getAvatarColor } from '../lib/getAvatarColor';
export { getValidRoomName } from '../lib/getValidRoomName';
export { placeholders } from '../lib/placeholders';
export { templateVarHandler } from '../lib/templateVarHandler';
export { mime } from '../lib/mimeTypes';
export { secondsToHHMMSS } from '../lib/timeConverter';
export * from './factory';

export const getURL = commonUtils.getURL.bind(commonUtils);
export const getUserPreference = userCommonUtils.getUserPreference.bind(userCommonUtils);
export const getUserAvatarURL = userCommonUtils.getUserAvatarURL.bind(userCommonUtils);
export const getAvatarURL = commonUtils.getAvatarURL.bind(commonUtils);
export const getRoomAvatarURL = roomCommonUtils.getRoomAvatarURL.bind(roomCommonUtils);
