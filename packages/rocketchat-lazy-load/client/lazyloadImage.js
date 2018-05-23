import './lazyloadImage.html';
import { addImage, fixCordova } from './';

Template.lazyloadImage.helpers({
	lazy() {
		const { preview, src, placeholder } = this;

		if (!preview && !placeholder) {
			return fixCordova(src);
		}
		return `data:image/png;base64,${ preview || 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8+/u3PQAJJAM0dIyWdgAAAABJRU5ErkJggg==' }`;
	}
});

Template.lazyloadImage.onRendered(function() {
	const element = Template.instance().firstNode;
	if (!element) {
		return;
	}
	addImage(element);
});
