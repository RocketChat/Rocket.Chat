import { Meteor } from 'meteor/meteor';

// TODO: Remove logs

export const share = ({ title, text, url }) => {
	const data = {
		title: title || 'Viasat Connect',
		text: text || '',
		url: url || 'https://viasatconnect.com',
	};

	console.log(`data: ${ JSON.stringify(data) }`);

	if (navigator.share) {
		navigator.share(data)
			.then(() => console.log('Successfully shared'))
			.catch((error) => console.log('Error while sharing', error));
	} else {
		console.log('Share feature not available');
		// TODO: Show Custom Share Options
	}
};

export const shareApp = () => {
	console.log('Share App called');
	const user = Meteor.user();

	const title = 'Viasat Connect';
	const text = 'Viasat Connect is a new application that makes it easy for me to chat with friends and family. Open this link and connect with me.';
	let url = new URL(document.location.href).origin;

	if (url) {
		url = `${ url }/direct/${ user.username }`;
	}

	share({ title, text, url });
};

export const shareRoom = () => {
	console.log('Share Room called');

	const url = document.location.href;
	const path = new URL(url).pathname;
	const roomName = path.substring(path.lastIndexOf('/') + 1);

	let title = 'Viasat Connect';
	let text = 'Viasat Connect is a new application that makes it easy for you to chat with friends and family. Open this link to connect.';

	if (path.startsWith('/channel')) {
		title = `Join #${ roomName } on Viasat Connect`;
		text = `You are invited to channel #${ roomName } on Viasat Connect. ${ text }`;
	} else if (path.startsWith('/group')) {
		title = `Join #${ roomName } on Viasat Connect`;
		text = `You are invited to private group 🔒${ roomName } on Viasat Connect. ${ text }`;
	} else if (path.startsWith('/direct')) {
		title = `Chat with @${ roomName } on Viasat Connect`;
	}

	share({ title, text, url });
};
