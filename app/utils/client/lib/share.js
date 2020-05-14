import { Meteor } from 'meteor/meteor';

import { settings } from '../../../settings';


export const isShareAvailable = () => {
	if (navigator.share) { return true; }
	return false;
};

export const getShareData = () => {
	const data = {};

	const siteName = settings.get('Site_Name') || '';
	const siteURL = settings.get('Site_Url') || '';

	data.url = document.location.href || siteURL;
	const path = new URL(data.url).pathname;
	const roomName = path.substring(path.lastIndexOf('/') + 1);

	const templateText = `${ siteName } is open source team communication app.`;

	data.title = `${ siteName }`;
	data.text = `${ templateText } Open this link to connect.`;

	if (path.startsWith('/channel')) {
		data.title = `Join #${ roomName } on ${ siteName }`;
		data.text = `You are invited to channel #${ roomName } on ${ siteName }. ${ data.text }`;
	} else if (path.startsWith('/group')) {
		data.title = `Join #${ roomName } on ${ siteName }`;
		data.text = `You are invited to private group 🔒${ roomName } on ${ siteName }. ${ data.text }`;
	} else if (path.startsWith('/direct')) {
		data.title = `Chat with @${ roomName } on ${ siteName }`;
	} else {
		const user = Meteor.user();

		data.title = `${ siteName }`;
		data.text = `${ templateText } Open this link and connect with me.`;
		data.url = new URL(document.location.href).origin;

		if (data.url && user) {
			data.url = `${ data.url }/direct/${ user.username }`;
		}
	}

	return data;
};

export const share = () => {
	const data = getShareData();

	if (navigator.share) {
		navigator.share(data)
			.then(() => console.log('Successfully shared'))
			.catch((error) => console.log('Error while sharing', error));
	} else {
		console.log('Share feature not available');
	}
};
