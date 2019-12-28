export const share = (title, text) => {
	console.log('Share called');

	let url = document.location.href;

	const canonicalElement = document.querySelector('link[rel=canonical]');
	if (canonicalElement !== null) {
		url = canonicalElement.href;
	}

	console.log(url);

	if (navigator.share) {
		navigator.share({
			title: 'web.dev',
			text: 'Check out web.dev.',
			url,
		})
			.then(() => console.log('Successful share'))
			.catch((error) => console.log('Error sharing', error));
	} else {
		console.log('Share feature not available');
	}
};
