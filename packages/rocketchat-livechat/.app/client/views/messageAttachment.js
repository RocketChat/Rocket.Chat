import visitor from '../../imports/client/visitor';

const fixLivechatUpload = function(url) {
	let livechatUrl = url;

	const query = `rc_room_type=${ 'l' }&rc_rid=${ visitor.getRoom() }&rc_token=${ visitor.getToken() }`;
	if (livechatUrl.indexOf('?') === -1) {
		livechatUrl = `${ livechatUrl }?${ query }`;
	} else {
		livechatUrl = `${ livechatUrl }&${ query }`;
	}

	return Meteor.absoluteUrl().replace(/\/$/, '') + livechatUrl;
};

Template.messageAttachment.helpers({
	fixLivechatUpload,
	injectIndex(data, previousIndex, index) {
		data.index = `${ previousIndex }.attachments.${ index }`;
	},

	getImageHeight(height = 200) {
		return height;
	},
});