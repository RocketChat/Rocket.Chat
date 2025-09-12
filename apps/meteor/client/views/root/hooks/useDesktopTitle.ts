import { useSetting } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

const { RocketChatDesktop } = window;

export const useDesktopTitle = () => {
	const title = useSetting('Site_Name', 'Rocket.Chat');

	useEffect(() => {
		if (!title) return;
		RocketChatDesktop?.setTitle(title);
	}, [title]);
};
