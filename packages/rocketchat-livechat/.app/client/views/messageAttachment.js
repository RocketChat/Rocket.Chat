import visitor from '../../imports/client/visitor';

const fixLivechatUpload = function(url) {
    let livechatUrl = url.replace('file-upload', 'livechat-file-upload');
    
	if (livechatUrl && livechatUrl.indexOf('data:image') === 0) {
		return livechatUrl;
	}
	if (Meteor.settings['public'].sandstorm || livechatUrl.match(/^(https?:)?\/\//i)) {
		return livechatUrl;
	} else {
		const query = `rc_rid=${ visitor.getRoom() }&rc_token=${ visitor.getToken() }`;
		if (livechatUrl.indexOf('?') === -1) {
			livechatUrl = `${ livechatUrl }?${ query }`;
		} else {
			livechatUrl = `${ livechatUrl }&${ query }`;
		}

		return Meteor.absoluteUrl(livechatUrl);
	}
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