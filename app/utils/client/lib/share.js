import { Meteor } from 'meteor/meteor';

// TODO: Remove logs

export const isShareAvailable = () => {
	if (navigator.share) { return true; }
	return false;
};

export const getShareData = () => {
	const data = {};

	data.url = document.location.href || 'https://viasatconnect.com';
	const path = new URL(data.url).pathname;
	const roomName = path.substring(path.lastIndexOf('/') + 1);

	data.title = 'Viasat Connect';
	data.text = 'Viasat Connect is a new application that makes it easy for you to chat with friends and family. Open this link to connect.';

	if (path.startsWith('/channel')) {
		data.title = `Join #${ roomName } on Viasat Connect`;
		data.text = `You are invited to channel #${ roomName } on Viasat Connect. ${ data.text }`;
	} else if (path.startsWith('/group')) {
		data.title = `Join #${ roomName } on Viasat Connect`;
		data.text = `You are invited to private group 🔒${ roomName } on Viasat Connect. ${ data.text }`;
	} else if (path.startsWith('/direct')) {
		data.title = `Chat with @${ roomName } on Viasat Connect`;
	} else {
		const user = Meteor.user();

		data.title = 'Viasat Connect';
		data.text = 'Viasat Connect is a new application that makes it easy for me to chat with friends and family. Open this link and connect with me.';
		data.url = new URL(document.location.href).origin;

		if (data.url && user) {
			data.url = `${ data.url }/direct/${ user.username }`;
		}
	}

	return data;
};

export const share = () => {
	const data = getShareData();

	console.log(`data: ${ JSON.stringify(data) }`);

	if (navigator.share) {
		navigator.share(data)
			.then(() => console.log('Successfully shared'))
			.catch((error) => console.log('Error while sharing', error));
	} else {
		console.log('Share feature not available');
	}
};
