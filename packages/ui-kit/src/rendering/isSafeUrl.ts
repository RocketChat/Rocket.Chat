const allowedProtocols = ['http:', 'https:', 'mailto:', 'tel:'];

const rootRelativePattern = /^\/(?![/\\])\S*$/;

/** Whether a URL sent by an app is safe to open from a button or menu option. */
export const isSafeUrl = (url: string): boolean => {
	if (rootRelativePattern.test(url)) {
		return true;
	}

	try {
		return allowedProtocols.includes(new URL(url).protocol);
	} catch {
		return false;
	}
};
