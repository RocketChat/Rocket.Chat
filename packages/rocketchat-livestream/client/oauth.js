export const close = (popup) => {
	return new Promise(function(resolve) {
		const checkInterval = setInterval(() => {
			if (popup.closed) {
				clearInterval(checkInterval);
				resolve();
			}
		}, 300);
	});
};

export const auth = async() => {
	const oauthWindow = window.open(`${ RocketChat.settings.get('Site_Url') }/api/v1/livestream/oauth?userId=${ Meteor.userId() }`, 'youtube-integration-oauth', 'width=400,height=600');
	return await close(oauthWindow);
};
