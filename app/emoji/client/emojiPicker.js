import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import { TAPi18n } from 'meteor/tap:i18n';

import { isSetNotNull } from './function-isSet';
import { EmojiPicker } from './lib/EmojiPicker';
import { emoji } from '../lib/rocketchat';

const emojiCategories = {};
/**
 * Turns category hash to a nice readable translated name
 * @param {string} category hash
 * @return {string} readable and translated
 */
function categoryName(category) {
	for (const emojiPackage in emoji.packages) {
		if (emoji.packages.hasOwnProperty(emojiPackage)) {
			if (emoji.packages[emojiPackage].emojiCategories.hasOwnProperty(category)) {
				const categoryTag = emoji.packages[emojiPackage].emojiCategories[category];
				return TAPi18n.__(categoryTag);
			}
		}
	}
	if (emojiCategories.hasOwnProperty(category)) {
		return emojiCategories[category];
	}
	// unknown category; better hash than nothing
	return category;
}

function getEmojisByCategory(category) {
	const t = Template.instance();
	const actualTone = t.tone;
	let html = '';
	for (const emojiPackage in emoji.packages) {
		if (emoji.packages.hasOwnProperty(emojiPackage)) {
			if (emoji.packages[emojiPackage].emojisByCategory.hasOwnProperty(category)) {
				const total = emoji.packages[emojiPackage].emojisByCategory[category].length;
				for (let i = 0; i < total; i++) {
					const _emoji = emoji.packages[emojiPackage].emojisByCategory[category][i];
					let tone = '';

					if (actualTone > 0 && emoji.packages[emojiPackage].toneList.hasOwnProperty(_emoji)) {
						tone = `_tone${ actualTone }`;
					}

					// set correctPackage here to allow for recent emojis to work properly
					if (isSetNotNull(() => emoji.list[`:${ _emoji }:`].emojiPackage)) {
						const correctPackage = emoji.list[`:${ _emoji }:`].emojiPackage;
						const image = emoji.packages[correctPackage].render(`:${ _emoji }${ tone }:`);

						html += `<li class="emoji-${ _emoji }" data-emoji="${ _emoji }" title="${ _emoji }">${ image }</li>`;
					}
				}
			}
		}
	}
	return html;
}

function getEmojisBySearchTerm(searchTerm) {
	let html = '';
	const t = Template.instance();
	const actualTone = t.tone;

	const searchRegExp = new RegExp(RegExp.escape(searchTerm.replace(/:/g, '')), 'i');

	for (let current in emoji.list) {
		if (!emoji.list.hasOwnProperty(current)) {
			continue;
		}

		if (searchRegExp.test(current)) {
			const emojiObject = emoji.list[current];
			const { emojiPackage } = emojiObject;
			let tone = '';
			current = current.replace(/:/g, '');

			if (actualTone > 0 && emoji.packages[emojiPackage].toneList.hasOwnProperty(emoji)) {
				tone = `_tone${ actualTone }`;
			}

			let emojiFound = false;

			for (const key in emoji.packages[emojiPackage].emojisByCategory) {
				if (emoji.packages[emojiPackage].emojisByCategory.hasOwnProperty(key)) {
					const contents = emoji.packages[emojiPackage].emojisByCategory[key];
					if (contents.indexOf(current) !== -1) {
						emojiFound = true;
						break;
					}
				}
			}

			if (emojiFound) {
				const image = emoji.packages[emojiPackage].render(`:${ current }${ tone }:`);
				html += `<li class="emoji-${ current }" data-emoji="${ current }" title="${ current }">${ image }</li>`;
			}
		}
	}

	return html;
}

Template.emojiPicker.helpers({
	category() {
		const categories = [];
		for (const emojiPackage in emoji.packages) {
			if (emoji.packages.hasOwnProperty(emojiPackage)) {
				for (const key in emoji.packages[emojiPackage].emojisByCategory) {
					if (emoji.packages[emojiPackage].emojisByCategory.hasOwnProperty(key)) {
						categories.push(key);
					}
				}
			}
		}
		return categories;
	},
	emojiByCategory(category) {
		let emojisByCategory = [];
		for (const emojiPackage in emoji.packages) {
			if (emoji.packages.hasOwnProperty(emojiPackage)) {
				if (emoji.packages[emojiPackage].emojisByCategory.hasOwnProperty(category)) {
					emojisByCategory = emojisByCategory.concat(emoji.packages[emojiPackage].emojisByCategory[category]);
				}
			}
		}
		return emojisByCategory;
	},
	isVisible(category) {
		return Template.instance().currentCategory.get() === category ? 'visible' : '';
	},
	emojiList(category) {
		const t = Template.instance();
		const searchTerm = t.currentSearchTerm.get();
		const activeCategory = t.currentCategory.get();
		// this will cause the reflow when recent list gets updated
		t.recentNeedsUpdate.get();

		// we only need to replace the active category, since switching tabs resets the filter
		if (activeCategory !== category) {
			return;
		}

		if (searchTerm.length > 0) {
			return getEmojisBySearchTerm(searchTerm);
		}
		return getEmojisByCategory(category);
	},
	currentTone() {
		return `tone-${ Template.instance().tone }`;
	},
	/**
	 * Returns true if a given emoji category is active
	 *
	 * @param {string} category hash
	 * @return {boolean} true if active, false otherwise
	 */
	activeCategory(category) {
		return Template.instance().currentCategory.get() === category ? 'active' : '';
	},
	categoryName,
	/**
	 * Returns currently active emoji category hash
	 *
	 * @return {string} category hash
	 */
	currentCategory() {
		const t = Template.instance();
		const hash = t.currentCategory.get();
		const searchTerm = t.currentSearchTerm.get();

		if (searchTerm.length > 0) {
			return TAPi18n.__('Search');
		}
		return categoryName(hash);
	},
});

Template.emojiPicker.events({
	'click .emoji-picker'(event) {
		event.stopPropagation();
		event.preventDefault();
	},
	'click .category-link'(event, instance) {
		event.stopPropagation();
		event.preventDefault();

		instance.$('.emoji-filter .search').val('').change();
		instance.$('.emoji-filter .search').focus();

		instance.currentCategory.set(event.currentTarget.hash.substr(1));

		return false;
	},
	'click .change-tone > a'(event, instance) {
		event.stopPropagation();
		event.preventDefault();

		instance.$('.tone-selector').toggleClass('show');
	},
	'click .tone-selector .tone'(event, instance) {
		event.stopPropagation();
		event.preventDefault();

		const tone = parseInt(event.currentTarget.dataset.tone);
		let newTone;

		if (tone > 0) {
			newTone = `_tone${ tone }`;
		} else {
			newTone = '';
		}

		for (const emojiPackage in emoji.packages) {
			if (emoji.packages.hasOwnProperty(emojiPackage)) {
				if (emoji.packages[emojiPackage].hasOwnProperty('toneList')) {
					for (const _emoji in emoji.packages[emojiPackage].toneList) {
						if (emoji.packages[emojiPackage].toneList.hasOwnProperty(_emoji)) {
							$(`.emoji-${ _emoji }`).html(emoji.packages[emojiPackage].render(`:${ _emoji }${ newTone }:`));
						}
					}
				}
			}
		}

		EmojiPicker.setTone(tone);

		instance.setCurrentTone(tone);

		$('.tone-selector').toggleClass('show');
	},
	'click .emoji-list li'(event, instance) {
		event.stopPropagation();

		const _emoji = event.currentTarget.dataset.emoji;
		const actualTone = instance.tone;
		let tone = '';

		for (const emojiPackage in emoji.packages) {
			if (emoji.packages.hasOwnProperty(emojiPackage)) {
				if (actualTone > 0 && emoji.packages[emojiPackage].toneList.hasOwnProperty(_emoji)) {
					tone = `_tone${ actualTone }`;
				}
			}
		}

		const input = $('.emoji-filter input.search');
		if (input) {
			input.val('');
		}
		instance.currentSearchTerm.set('');

		EmojiPicker.pickEmoji(_emoji + tone);
	},
	'keyup .js-emojipicker-search, change .js-emojipicker-search'(event, instance) {
		const value = event.target.value.trim();
		const cst = instance.currentSearchTerm;
		if (value === cst.get()) {
			return;
		}
		cst.set(value);
	},
});

Template.emojiPicker.onCreated(function() {
	this.tone = EmojiPicker.getTone();
	const recent = EmojiPicker.getRecent();
	this.recentNeedsUpdate = new ReactiveVar(false);
	this.currentCategory = new ReactiveVar(recent.length > 0 ? 'recent' : 'people');
	this.currentSearchTerm = new ReactiveVar('');

	recent.forEach((_emoji) => {
		emoji.packages.base.emojisByCategory.recent.push(_emoji);
	});

	this.setCurrentTone = (newTone) => {
		$('.current-tone').removeClass(`tone-${ this.tone }`);
		$('.current-tone').addClass(`tone-${ newTone }`);
		this.tone = newTone;
	};

	this.autorun(() => {
		if (this.recentNeedsUpdate.get()) {
			this.recentNeedsUpdate.set(false);
		}
	});
});
