import './lazyloadImage.html';
import { addImage, fixCordova } from './';

Template.lazyloadImage.helpers({
	class() {
		const loaded = Template.instance().loaded.get();
		return `${ this.class } ${ loaded ? '' : 'lazy-img' }`;
	},
	lazy() {
		const { preview, placeholder, src } = this;
		if (Template.instance().loaded.get() ||(!preview && !placeholder)) {
			return fixCordova(src);
		}
		return `data:image/png;base64,${ preview || 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8+/u3PQAJJAM0dIyWdgAAAABJRU5ErkJggg==' }`;
	}
});

Template.lazyloadImage.onCreated(function() {
	this.loaded = new ReactiveVar(false);
});

Template.lazyloadImage.onRendered(function() {
	addImage(this);
});
