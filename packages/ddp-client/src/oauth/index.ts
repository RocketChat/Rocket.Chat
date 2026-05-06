// OAuth helpers — browser-side popup/redirect handshake. Drop-in replacement
// for the subset of `meteor/oauth` actually consumed by Rocket.Chat client
// code. Meteor's `OAuth._redirectUri` stays out (RC's redirectUri builder
// adds the legacy `?close` suffix, so it lives next to the call sites).
export { launchLogin, getDataAfterRedirect } from './launchLogin';
export { resolveLoginStyle } from './loginStyle';
export { stateParam } from './stateParam';
export { showPopup } from './showPopup';
export type { LaunchLoginOptions, LoginStyle, LoginStyleConfig, LoginStyleOptions, PopupDimensions, StateParamOptions } from './types';
