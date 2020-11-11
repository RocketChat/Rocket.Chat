import { Template } from 'meteor/templating';

import { getShareData } from '../../utils';

function getShareString() {
	const data = getShareData();
	return `${ data.title } \n${ data.url } \n${ data.text }`;
}

function fallbackCopyTextToClipboard(text) {
	const textArea = document.createElement('textarea');
	textArea.value = text;
	textArea.style.position = 'fixed'; // avoid scrolling to bottom
	document.body.appendChild(textArea);
	textArea.focus();
	textArea.select();

	try {
		document.execCommand('copy');
	} catch (err) {
		console.error('Unable to copy', err);
	}

	document.body.removeChild(textArea);
}

Template.share.helpers({

});

Template.share.events({
	'click [data-type="copy"]'() {
		if (!navigator.clipboard) {
			fallbackCopyTextToClipboard(getShareString());
			return;
		}
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
		location.href = `sms:?&body=${ getShareString() }`;
	},


	'click [data-type="facebook"]'() {
		const { url } = getShareData();
		window.open(`https://www.facebook.com/sharer/sharer.php?u=${ encodeURIComponent(url) }`);
	},
	'click [data-type="whatsapp"]'() {
		window.open(`https://api.whatsapp.com/send?text=${ encodeURIComponent(getShareString()) }`);
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
		window.open(`https://telegram.me/share/msg?url=${ url }&text=${ getShareString() }`);
	},

});
