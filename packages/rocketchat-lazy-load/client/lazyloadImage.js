import './lazyloadImage.html';
import { addImage, fixCordova } from './';

Template.lazyloadImage.helpers({
	lazy() {
		const { preview, src } = this;

		if (!preview) {
			return fixCordova(src);
		}
		return `data:image/png;base64,${ preview }`;
	}
});

Template.lazyloadImage.onCreated(function() {
	const element = Template.instance().firstNode;
	if (!element) {
		return;
	}
	addImage(element);
});
