import { addAction } from '../../../client/views/room/lib/Toolbox';

addAction('visitor-info', {
	groups: ['live'],
	id: 'visitor-info',
	title: 'Visitor_Info',
	icon: 'info-circled',
	template: 'visitorInfo',
	order: 0,
});

addAction('contact-chat-history', {
	groups: ['live'],
	id: 'contact-chat-history',
	title: 'Contact_Chat_History',
	icon: 'clock',
	template: 'contactChatHistory',
	order: 11,
});
