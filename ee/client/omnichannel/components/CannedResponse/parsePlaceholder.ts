import { IOmnichannelRoom } from '../../../../../definition/IRoom';

export const parsePlaceHolder = (text: string, room: IOmnichannelRoom): string => {
	const placeholders = text.match(/{{(.*?)}}/g);
	const placeholderDict = {
		'contact.name': room.v.name,
		'contact.email': room.v.visitorEmails?.length ? room.v.visitorEmails[0].address : '',
		// 'contact.phone': room.v.status,	//No phone information in livechat form yet
		'agent.name': room.servedBy?.name ? room.servedBy.name : '',
		'agent.email': room.servedBy?.emails?.length ? room.servedBy.emails[0].address : '',
	};

	placeholders?.length &&
		placeholders.forEach((placeholder: string) => {
			const placeholderWithoutKeyChars = placeholder.replace(/({{)|(}})/g, '') as
				| 'contact.name'
				| 'contact.email'
				| 'agent.name'
				| 'agent.email';

			text = text.replace(placeholder, placeholderDict[placeholderWithoutKeyChars]);
		});

	return text;
};
