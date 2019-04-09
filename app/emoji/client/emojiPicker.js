import { ReactiveVar } from 'meteor/reactive-var';
import { emoji } from '../lib/rocketchat';
import { Template } from 'meteor/templating';
import { isSetNotNull } from './function-isSet';
import { EmojiPicker } from './lib/EmojiPicker';
import { TAPi18n } from 'meteor/tap:i18n';
import _ from 'underscore';

const emojiPickerContent = new ReactiveVar('');

function getEmojis(instance) {
	const categories = instance.categoriesList;
	const actualTone = instance.tone;
	let html = '';
	_.each(emoji.packages, function(emojiPackage) {
		_.each(emojiPackage.emojisByCategory, function(emojis, category) {
			if (emojis.length === 0 || category === 'modifier' || category === 'regional') {
				return;
			}
			const cat = categories.find((o) => o.key === category);

			html += `<h4 id="emoji-list-category-${ category }">${ TAPi18n.__(cat.i18n) }</h4>`;
			_.each(emojis, function(_emoji) {
				let tone = '';
				if (actualTone > 0 && emojiPackage.toneList.hasOwnProperty(_emoji)) {
					tone = `_tone${ actualTone }`;
				}
				if (isSetNotNull(() => emoji.list[`:${ _emoji }:`].emojiPackage)) {
					const correctPackage = emoji.list[`:${ _emoji }:`].emojiPackage;
					const image = emoji.packages[correctPackage].render(`:${ _emoji }${ tone }:`);
					html += `<li class="emoji-${ _emoji }" data-emoji="${ _emoji }" title="${ _emoji }">${ image }</li>`;
				}
			});
		});
	});
	emojiPickerContent.set(html);
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
	emojiCategories() {
		return Template.instance().categoriesList;
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
	emojiList() {
		const t = Template.instance();
		const searchTerm = t.currentSearchTerm.get();

		// this will cause the reflow when recent list gets updated
		t.recentNeedsUpdate.get();

		if (searchTerm.length > 0) {
			return getEmojisBySearchTerm(searchTerm);
		} else {
			return emojiPickerContent.get();
		}
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
	/**
	 * Returns currently active emoji category hash
	 *
	 * @return {string} category hash
	 */
	currentCategory() {
		return Template.instance().currentCategory.get();
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

		instance.$('.emoji-picker .js-emojipicker-search').val('').change();
		instance.$('.emoji-picker .js-emojipicker-search').focus();

		instance.currentCategory.set(event.currentTarget.hash.substr(1));

		instance.$('.emoji-picker .emojis')[0].scrollTo(top);
		instance.$('.emoji-picker .emojis').animate({
			scrollTop: ($(`#emoji-list-category-${ event.currentTarget.hash.substr(1) }`).offset().top - $('.emoji-picker .emojis').offset().top),
		}, 300);

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

		const input = $('.emoji-picker .js-emojipicker-search');
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

	this.categoriesList = [];
	for (const emojiPackage in emoji.packages) {
		if (emoji.packages.hasOwnProperty(emojiPackage)) {
			if (emoji.packages[emojiPackage].emojiCategories) {
				if (typeof emoji.packages[emojiPackage].categoryIndex !== 'undefined') {
					this.categoriesList.splice(emoji.packages[emojiPackage].categoryIndex, 0, ...emoji.packages[emojiPackage].emojiCategories);
				} else {
					this.categoriesList = this.categoriesList.concat(emoji.packages[emojiPackage].emojiCategories);
				}
			}
		}
	}

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
	const instance = Template.instance();
	getEmojis(instance);
});
