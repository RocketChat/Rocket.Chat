import type { RoomToolboxActionConfig } from '@rocket.chat/ui-contexts';
import { lazy, useMemo } from 'react';

const ContactInfoRouter = lazy(() => import('../contactInfo/ContactInfoRouter'));

export const useContactProfileRoomAction = () => {
	return useMemo(
		(): RoomToolboxActionConfig => ({
			id: 'contact-profile',
			groups: ['live'],
			title: 'Contact_Info',
			icon: 'user',
			tabComponent: ContactInfoRouter,
			order: 1,
		}),
		[],
	);
};
