import { Template } from 'meteor/templating';

import { getShareData, isMobile } from '../../utils';

function getShareString() {
	const data = getShareData();
	return `${ data.title } \n${ data.url } \n${ data.text }`;
}

Template.share.helpers({

});

Template.share.events({
	'click [data-type="copy"]'() {
		console.log(getShareString());
		navigator.clipboard.writeText(getShareString());
	},
	'click [data-type="print"]'() {
		self.print();
	},
	'click [data-type="email"]'() {
		const { title } = getShareData();
		window.open(`mailto:?subject=${ title }&body=${ getShareString() }`);
	},
	'click [data-type="sms"]'() {
		location.href = `sms:'Pick a contact'?&body=${ getShareString() }`;
	},


	'click [data-type="facebook"]'() {
		window.open(`https://www.facebook.com/sharer/sharer.php?u=${ getShareString() }`);
	},
	'click [data-type="whatsapp"]'() {
		window.open((isMobile() ? 'whatsapp://send?text=' : 'https://api.whatsapp.com/send?text=') + getShareString());
	},
	'click [data-type="twitter"]'() {
		const { url } = getShareData();
		window.open(`http://twitter.com/share?text=${ getShareString() }&url=${ url }`);
	},
	'click [data-type="linkedin"]'() {
		const { title, url } = getShareData();
		window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${ url }&title=${ title }&summary=${ getShareString() }&source=LinkedIn`);
	},
	'click [data-type="telegram"]'() {
		const { url } = getShareData();
		window.open(isMobile() ? `tg://msg?text=${ getShareString() }` : `https://telegram.me/share/msg?url=${ url }&text=${ getShareString() }`);
	},

});
