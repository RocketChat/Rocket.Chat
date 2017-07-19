/* globals Template, isSetNotNull */
const emojiCategories = {};
/**
 * Turns category hash to a nice readable translated name
 * @param {string} category hash
 * @return {string} readable and translated
 */
function categoryName(category) {
	for (const emojiPackage in RocketChat.emoji.packages) {
		if (RocketChat.emoji.packages.hasOwnProperty(emojiPackage)) {
			if (RocketChat.emoji.packages[emojiPackage].emojiCategories.hasOwnProperty(category)) {
				const categoryTag = RocketChat.emoji.packages[emojiPackage].emojiCategories[category];
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
	for (const emojiPackage in RocketChat.emoji.packages) {
		if (RocketChat.emoji.packages.hasOwnProperty(emojiPackage)) {
			if (RocketChat.emoji.packages[emojiPackage].emojisByCategory.hasOwnProperty(category)) {
				const total = RocketChat.emoji.packages[emojiPackage].emojisByCategory[category].length;
				for (let i = 0; i < total; i++) {
					const emoji = RocketChat.emoji.packages[emojiPackage].emojisByCategory[category][i];
					let tone = '';

					if (actualTone > 0 && RocketChat.emoji.packages[emojiPackage].toneList.hasOwnProperty(emoji)) {
						tone = `_tone${ actualTone }`;
					}

					//set correctPackage here to allow for recent emojis to work properly
					if (isSetNotNull(() => RocketChat.emoji.list[`:${ emoji }:`].emojiPackage)) {
						const correctPackage = RocketChat.emoji.list[`:${ emoji }:`].emojiPackage;
						const image = RocketChat.emoji.packages[correctPackage].render(`:${ emoji }${ tone }:`);

						html += `<li class="emoji-${ emoji }" data-emoji="${ emoji }" title="${ emoji }">${ image }</li>`;
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

	for (let emoji in RocketChat.emoji.list) {
		if (!RocketChat.emoji.list.hasOwnProperty(emoji)) {
			continue;
		}

		if (searchRegExp.test(emoji)) {
			const emojiObject = RocketChat.emoji.list[emoji];
			const emojiPackage = emojiObject.emojiPackage;
			let tone = '';
			emoji = emoji.replace(/:/g, '');

			if (actualTone > 0 && RocketChat.emoji.packages[emojiPackage].toneList.hasOwnProperty(emoji)) {
				tone = `_tone${ actualTone }`;
			}

			let emojiFound = false;

			for (const key in RocketChat.emoji.packages[emojiPackage].emojisByCategory) {
				if (RocketChat.emoji.packages[emojiPackage].emojisByCategory.hasOwnProperty(key)) {
					const contents = RocketChat.emoji.packages[emojiPackage].emojisByCategory[key];
					if (contents.indexOf(emoji) !== -1) {
						emojiFound = true;
						break;
					}
				}
			}

			if (emojiFound) {
				const image = RocketChat.emoji.packages[emojiPackage].render(`:${ emoji }${ tone }:`);
				html += `<li class="emoji-${ emoji }" data-emoji="${ emoji }" title="${ emoji }">${ image }</li>`;
			}
		}
	}

	return html;
}

Template.emojiPicker.helpers({
	category() {
		const categories = [];
		for (const emojiPackage in RocketChat.emoji.packages) {
			if (RocketChat.emoji.packages.hasOwnProperty(emojiPackage)) {
				for (const key in RocketChat.emoji.packages[emojiPackage].emojisByCategory) {
					if (RocketChat.emoji.packages[emojiPackage].emojisByCategory.hasOwnProperty(key)) {
						categories.push(key);
					}
				}
			}
		}
		return categories;
	},
	emojiByCategory(category) {
		let emojisByCategory = [];
		for (const emojiPackage in RocketChat.emoji.packages) {
			if (RocketChat.emoji.packages.hasOwnProperty(emojiPackage)) {
				if (RocketChat.emoji.packages[emojiPackage].emojisByCategory.hasOwnProperty(category)) {
					emojisByCategory = emojisByCategory.concat(RocketChat.emoji.packages[emojiPackage].emojisByCategory[category]);
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
		//this will cause the reflow when recent list gets updated
		t.recentNeedsUpdate.get();

		//we only need to replace the active category, since switching tabs resets the filter
		if (activeCategory !== category) {
			return;
		}

		if (searchTerm.length > 0) {
			return getEmojisBySearchTerm(searchTerm);
		} else {
			return getEmojisByCategory(category);
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
		} else {
			return categoryName(hash);
		}
	}
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

		for (const emojiPackage in RocketChat.emoji.packages) {
			if (RocketChat.emoji.packages.hasOwnProperty(emojiPackage)) {
				if (RocketChat.emoji.packages[emojiPackage].hasOwnProperty('toneList')) {
					for (const emoji in RocketChat.emoji.packages[emojiPackage].toneList) {
						if (RocketChat.emoji.packages[emojiPackage].toneList.hasOwnProperty(emoji)) {
							$(`.emoji-${ emoji }`).html(RocketChat.emoji.packages[emojiPackage].render(`:${ emoji }${ newTone }:`));
						}
					}
				}
			}
		}

		RocketChat.EmojiPicker.setTone(tone);

		instance.setCurrentTone(tone);

		$('.tone-selector').toggleClass('show');
	},
	'click .emoji-list li'(event, instance) {
		event.stopPropagation();

		const emoji = event.currentTarget.dataset.emoji;
		const actualTone = instance.tone;
		let tone = '';

		for (const emojiPackage in RocketChat.emoji.packages) {
			if (RocketChat.emoji.packages.hasOwnProperty(emojiPackage)) {
				if (actualTone > 0 && RocketChat.emoji.packages[emojiPackage].toneList.hasOwnProperty(emoji)) {
					tone = `_tone${ actualTone }`;
				}
			}
		}

		const input = $('.emoji-filter input.search');
		if (input) {
			input.val('');
		}
		instance.currentSearchTerm.set('');

		RocketChat.EmojiPicker.pickEmoji(emoji + tone);
	},
	'keydown .emoji-filter .search'(event) {
		if (event.keyCode === 13) {
			event.preventDefault();
		}
	},
	'keyup .emoji-filter .search, change .emoji-filter .search'(event, instance) {
		const value = event.target.value.trim();
		const cst = instance.currentSearchTerm;
		if (value === cst.get()) {
			return;
		}
		cst.set(value);
	}
});

Template.emojiPicker.onCreated(function() {
	this.tone = RocketChat.EmojiPicker.getTone();
	const recent = RocketChat.EmojiPicker.getRecent();
	this.recentNeedsUpdate = new ReactiveVar(false);
	this.currentCategory = new ReactiveVar(recent.length > 0 ? 'recent' : 'people');
	this.currentSearchTerm = new ReactiveVar('');

	recent.forEach((emoji) => {
		RocketChat.emoji.packages.base.emojisByCategory.recent.push(emoji);
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
