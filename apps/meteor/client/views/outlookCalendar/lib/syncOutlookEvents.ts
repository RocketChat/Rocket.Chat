import { NotOnDesktopError } from './NotOnDesktopError';

export const syncOutlookEvents = async () => {
	const date = new Date();
	const desktopApp = window.RocketChatDesktop;

	if (!desktopApp?.getOutlookEvents) {
		throw new NotOnDesktopError();
	}

	const response = await desktopApp.getOutlookEvents(date);
	if (response.status === 'canceled') {
		throw new Error('abort');
	}
};
