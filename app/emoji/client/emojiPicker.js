import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';
import { TAPi18n } from 'meteor/tap:i18n';
import { Template } from 'meteor/templating';

import { emoji } from '../lib/rocketchat';
import { EmojiPicker } from './lib/EmojiPicker';

const emojiPickerContent = new ReactiveVar('');

export const recentEmojisNeedsUpdate = new ReactiveVar(false);

const getEmojiElement = (emoji, image) => `<li class="emoji-${ emoji } emoji-picker-item" data-emoji="${ emoji }" title="${ emoji }">${ image }</li>`;

export function updateRecentEmoji() {
	const html = Object.values(emoji.packages).map((emojiPackage) => {
		if (!emojiPackage.emojisByCategory.recent) {
			return;
		}

		return emojiPackage.emojisByCategory.recent.map((current) => {
			return getEmojiElement(current, emojiPackage.render(`:${ current }:`));
		}).join('');
	}).join('') || `<li>${ TAPi18n.__('No_emojis_found') }</li>`;

	document.querySelector('.emoji-category-recent').innerHTML = html;
}

function getEmojis(instance) {
	const categories = instance.categoriesList;
	const actualTone = instance.tone;
	let html = '';

	categories.forEach((category) => {
		html += `<h4 id="emoji-list-category-${ category.key }">${ TAPi18n.__(category.i18n) }</h4>`;
		html += `<ul class="emoji-list emoji-category-${ category.key }">`;
		html += Object.values(emoji.packages).map((emojiPackage) => {
			if (!emojiPackage.emojisByCategory[category.key]) {
				return;
			}

			return emojiPackage.emojisByCategory[category.key].map((current) => {
				const tone = actualTone > 0 && emojiPackage.toneList.hasOwnProperty(current) ? `_tone${ actualTone }` : '';
				return getEmojiElement(current, emojiPackage.render(`:${ current }${ tone }:`));
			}).join('');
		}).join('') || `<li>${ TAPi18n.__('No_emojis_found') }</li>`;
		html += '</ul>';
	});

	emojiPickerContent.set(html);
}

function getEmojisBySearchTerm(searchTerm) {
	let html = '<ul class="emoji-list">';
	const t = Template.instance();
	const actualTone = t.tone;

	t.currentCategory.set('');

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
				html += getEmojiElement(current, image);
			}
		}
	}
	html += '</ul>';

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
		recentEmojisNeedsUpdate.get();

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

		Tracker.afterFlush(() => {
			const header = instance.$(`#emoji-list-category-${ event.currentTarget.hash.substr(1) }`);
			const container = instance.$('.emoji-picker .emojis');

			const scrollTop = header.position().top + container.scrollTop() - container.position().top;

			container.animate({
				scrollTop,
			}, 300);
		});

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
	'click .emoji-list li.emoji-picker-item'(event, instance) {
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

	this.currentCategory = new ReactiveVar('recent');
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
		if (recentEmojisNeedsUpdate.get()) {
			recentEmojisNeedsUpdate.set(false);
		}
	});
	const instance = Template.instance();
	getEmojis(instance);
});
