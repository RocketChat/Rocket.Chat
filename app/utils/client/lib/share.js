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

	const title = 'Viasat Connect';
	const text = 'Viasat Connect is a new application that makes it easy for me to chat with friends and family. Open this link and connect with me.';
	const url = new URL(document.location.href).origin; // TODO: Concat username

	share({ title, text, url });
};

export const shareRoom = () => {
	console.log('Share Room called');

	// TODO: Embed Room Name if channel or group, Different msg for direct room
	const title = 'Viasat Connect';
	const text = 'You are invited to {Room Name} on Viasat Connect. Viasat Connect is a new application that makes it easy for me to chat with friends and family. Open this link and connect with me.';
	const url = document.location.href;

	share({ title, text, url });
};
