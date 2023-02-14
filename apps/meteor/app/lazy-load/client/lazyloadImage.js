import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';

import './lazyloadImage.html';
import { addImage } from '.';

const emptyImageEncoded = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8+/u3PQAJJAM0dIyWdgAAAABJRU5ErkJggg==';

const imgsrcs = new Set();

Template.lazyloadImage.helpers({
	class() {
		const loaded = Template.instance().loaded.get();
		return `${this.class} ${loaded ? '' : 'lazy-img'}`;
	},

	srcUrl() {
		if (Template.instance().loaded.get()) {
			return;
		}
		return this.src;
	},

	lazySrcUrl() {
		const { preview, placeholder, src } = this;
		const { loaded } = Template.instance();

		if (loaded.get() || (!preview && !placeholder) || imgsrcs.has(src)) {
			return src;
		}

		imgsrcs.add(this.src);
		return `data:image/png;base64,${preview || emptyImageEncoded}`;
	},
});

Template.lazyloadImage.onCreated(function () {
	this.loaded = new ReactiveVar(false);
});

Template.lazyloadImage.onRendered(function () {
	addImage(this);
});
