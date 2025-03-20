export const parseOfflineMessage = (fields = {}) => {
	return Object.assign(fields, { host: window.location.origin });
};
