import { e2e as _e2e } from './rocketchat.e2e';

export const changePassword = _e2e.changePassword.bind(_e2e);
export const getRoomEncryptionInstance = _e2e.getInstanceByRoomId.bind(_e2e);
export const getState = _e2e.getState.bind(_e2e);

/**
 * @deprecated use bound functions directly from the `e2e` object instead
 */
export const e2e = _e2e;
