import { useSsl } from '../api';

// This will allow widgets that are on different domains to send cookies to the server
// The default config for same-site (lax) dissalows to send a cookie to a "3rd party" unless the user performs an action
// like a click. Secure flag is required when SameSite is set to None
const getSecureCookieSettings = () => (useSsl ? 'SameSite=None; Secure;' : '');

export const setInitCookies = () => {
	document.cookie = `rc_is_widget=t; path=/; ${getSecureCookieSettings()}`;
	document.cookie = `rc_room_type=l; path=/; ${getSecureCookieSettings()}`;
};

export const setCookies = (rid: string, token: string) => {
	document.cookie = `rc_rid=${rid}; path=/; ${getSecureCookieSettings()}`;
	document.cookie = `rc_token=${token}; path=/; ${getSecureCookieSettings()}`;
	document.cookie = `rc_room_type=l; path=/; ${getSecureCookieSettings()}`;
};
