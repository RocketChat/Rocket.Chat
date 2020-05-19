import { userCommonUtils, commonUtils, roomCommonUtils } from './factory';

export { t, isRtl } from '../lib/tapi18n';
export { getDefaultSubscriptionPref } from '../lib/getDefaultSubscriptionPref';
export { Info } from '../rocketchat.info';
export { isEmail } from '../lib/isEmail';
export { handleError } from './lib/handleError';
export { fileUploadMediaWhiteList, fileUploadIsValidContentType } from '../lib/fileUploadRestrictions';
export { roomTypes } from './lib/roomTypes';
export { RoomTypeRouteConfig, RoomTypeConfig, RoomSettingsEnum, RoomMemberActions, UiTextContext } from '../lib/RoomTypeConfig';
export { RoomTypesCommon } from '../lib/RoomTypesCommon';
export { slashCommands } from '../lib/slashCommand';
export { getUserNotificationPreference } from '../lib/getUserNotificationPreference';
export { applyCustomTranslations } from './lib/CustomTranslations';
export { getAvatarColor } from '../lib/getAvatarColor';
export { getValidRoomName } from '../lib/getValidRoomName';
export { placeholders } from '../lib/placeholders';
export { templateVarHandler } from '../lib/templateVarHandler';
export { APIClient, mountArrayQueryParameters } from './lib/RestApiClient';
export { canDeleteMessage } from './lib/canDeleteMessage';
export { mime } from '../lib/mimeTypes';
export { secondsToHHMMSS } from '../lib/timeConverter';
export * from './factory';

export const getURL = commonUtils.getURL.bind(commonUtils);
export const getUserPreference = userCommonUtils.getUserPreference.bind(userCommonUtils);
export const getUserAvatarURL = userCommonUtils.getUserAvatarURL.bind(userCommonUtils);
export const getAvatarURL = commonUtils.getAvatarURL.bind(commonUtils);
export const getRoomAvatarURL = roomCommonUtils.getRoomAvatarURL.bind(roomCommonUtils);
