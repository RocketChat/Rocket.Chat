import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { escapeRegExp } from '@rocket.chat/string-helpers';

import { isSetNotNull } from './function-isSet';
import { RoomManager } from '../../../ui-utils/client';
import { emoji, EmojiPicker } from '../../../emoji/client';
import { CachedCollectionManager } from '../../../ui-cached-collection/client';
import { APIClient } from '../../../utils/client';

export const getEmojiUrlFromName = function (name, extension) {
	Session.get;

	const key = `emoji_random_${name}`;

	let random = 0;
	if (isSetNotNull(() => Session.keys[key])) {
		random = Session.keys[key];
	}

	if (name == null) {
		return;
	}
	const path = __meteor_runtime_config__.ROOT_URL_PATH_PREFIX || '';
	return `${path}/emoji-custom/${encodeURIComponent(name)}.${extension}?_dc=${random}`;
};

export const deleteEmojiCustom = function (emojiData) {
	delete emoji.list[`:${emojiData.name}:`];
	const arrayIndex = emoji.packages.emojiCustom.emojisByCategory.rocket.indexOf(emojiData.name);
	if (arrayIndex !== -1) {
		emoji.packages.emojiCustom.emojisByCategory.rocket.splice(arrayIndex, 1);
	}
	const arrayIndexList = emoji.packages.emojiCustom.list.indexOf(`:${emojiData.name}:`);
	if (arrayIndexList !== -1) {
		emoji.packages.emojiCustom.list.splice(arrayIndexList, 1);
	}
	if (isSetNotNull(() => emojiData.aliases)) {
		for (const alias of emojiData.aliases) {
			delete emoji.list[`:${alias}:`];
			const aliasIndex = emoji.packages.emojiCustom.list.indexOf(`:${alias}:`);
			if (aliasIndex !== -1) {
				emoji.packages.emojiCustom.list.splice(aliasIndex, 1);
			}
		}
	}
	EmojiPicker.updateRecent('rocket');
};

export const updateEmojiCustom = function (emojiData) {
	let key = `emoji_random_${emojiData.name}`;
	Session.set(key, Math.round(Math.random() * 1000));

	const previousExists = isSetNotNull(() => emojiData.previousName);
	const currentAliases = isSetNotNull(() => emojiData.aliases);

	if (previousExists && isSetNotNull(() => emoji.list[`:${emojiData.previousName}:`].aliases)) {
		for (const alias of emoji.list[`:${emojiData.previousName}:`].aliases) {
			delete emoji.list[`:${alias}:`];
			const aliasIndex = emoji.packages.emojiCustom.list.indexOf(`:${alias}:`);
			if (aliasIndex !== -1) {
				emoji.packages.emojiCustom.list.splice(aliasIndex, 1);
			}
		}
	}

	if (previousExists && emojiData.name !== emojiData.previousName) {
		const arrayIndex = emoji.packages.emojiCustom.emojisByCategory.rocket.indexOf(emojiData.previousName);
		if (arrayIndex !== -1) {
			emoji.packages.emojiCustom.emojisByCategory.rocket.splice(arrayIndex, 1);
		}
		const arrayIndexList = emoji.packages.emojiCustom.list.indexOf(`:${emojiData.previousName}:`);
		if (arrayIndexList !== -1) {
			emoji.packages.emojiCustom.list.splice(arrayIndexList, 1);
		}
		delete emoji.list[`:${emojiData.previousName}:`];
	}

	const categoryIndex = emoji.packages.emojiCustom.emojisByCategory.rocket.indexOf(`${emojiData.name}`);
	if (categoryIndex === -1) {
		emoji.packages.emojiCustom.emojisByCategory.rocket.push(`${emojiData.name}`);
		emoji.packages.emojiCustom.list.push(`:${emojiData.name}:`);
	}
	emoji.list[`:${emojiData.name}:`] = Object.assign({ emojiPackage: 'emojiCustom' }, emoji.list[`:${emojiData.name}:`], emojiData);
	if (currentAliases) {
		for (const alias of emojiData.aliases) {
			emoji.packages.emojiCustom.list.push(`:${alias}:`);
			emoji.list[`:${alias}:`] = {};
			emoji.list[`:${alias}:`].emojiPackage = 'emojiCustom';
			emoji.list[`:${alias}:`].aliasOf = emojiData.name;
		}
	}

	const url = getEmojiUrlFromName(emojiData.name, emojiData.extension);

	// update in admin interface
	if (previousExists && emojiData.name !== emojiData.previousName) {
		$(document)
			.find(`.emojiAdminPreview-image[data-emoji='${emojiData.previousName}']`)
			.css('background-image', `url('${url})'`)
			.attr('data-emoji', `${emojiData.name}`);
	} else {
		$(document).find(`.emojiAdminPreview-image[data-emoji='${emojiData.name}']`).css('background-image', `url('${url}')`);
	}

	// update in picker
	if (previousExists && emojiData.name !== emojiData.previousName) {
		$(document)
			.find(`li[data-emoji='${emojiData.previousName}'] span`)
			.css('background-image', `url('${url}')`)
			.attr('data-emoji', `${emojiData.name}`);
		$(document)
			.find(`li[data-emoji='${emojiData.previousName}']`)
			.attr('data-emoji', `${emojiData.name}`)
			.attr('class', `emoji-${emojiData.name}`);
	} else {
		$(document).find(`li[data-emoji='${emojiData.name}'] span`).css('background-image', `url('${url}')`);
	}

	// update in picker and opened rooms
	for (key in RoomManager.openedRooms) {
		if (RoomManager.openedRooms.hasOwnProperty(key)) {
			const room = RoomManager.openedRooms[key];
			if (previousExists && emojiData.name !== emojiData.previousName) {
				$(room.dom)
					.find(`span[data-emoji='${emojiData.previousName}']`)
					.css('background-image', `url('${url}')`)
					.attr('data-emoji', `${emojiData.name}`);
			} else {
				$(room.dom).find(`span[data-emoji='${emojiData.name}']`).css('background-image', `url('${url}')`);
			}
		}
	}

	EmojiPicker.updateRecent('rocket');
};

const customRender = (html) => {
	const emojisMatchGroup = emoji.packages.emojiCustom.list.map(escapeRegExp).join('|');
	if (emojisMatchGroup !== emoji.packages.emojiCustom._regexpSignature) {
		emoji.packages.emojiCustom._regexpSignature = emojisMatchGroup;
		emoji.packages.emojiCustom._regexp = new RegExp(
			`<object[^>]*>.*?<\/object>|<span[^>]*>.*?<\/span>|<(?:object|embed|svg|img|div|span|p|a)[^>]*>|(${emojisMatchGroup})`,
			'gi',
		);
	}

	html = html.replace(emoji.packages.emojiCustom._regexp, (shortname) => {
		if (typeof shortname === 'undefined' || shortname === '' || emoji.packages.emojiCustom.list.indexOf(shortname) === -1) {
			return shortname;
		}

		let emojiAlias = shortname.replace(/:/g, '');

		let dataCheck = emoji.list[shortname];
		if (dataCheck.hasOwnProperty('aliasOf')) {
			emojiAlias = dataCheck.aliasOf;
			dataCheck = emoji.list[`:${emojiAlias}:`];
		}

		return `<span class="emoji" style="background-image:url(${getEmojiUrlFromName(
			emojiAlias,
			dataCheck.extension,
		)});" data-emoji="${emojiAlias}" title="${shortname}">${shortname}</span>`;
	});

	return html;
};

emoji.packages.emojiCustom = {
	emojiCategories: [{ key: 'rocket', i18n: 'Custom' }],
	categoryIndex: 1,
	toneList: {},
	list: [],
	_regexpSignature: null,
	_regexp: null,

	render: customRender,
	renderPicker: customRender,
};

Meteor.startup(() =>
	CachedCollectionManager.onLogin(async () => {
		try {
			const {
				emojis: { update: emojis },
			} = await APIClient.v1.get('emoji-custom.list');

			emoji.packages.emojiCustom.emojisByCategory = { rocket: [] };
			for (const currentEmoji of emojis) {
				emoji.packages.emojiCustom.emojisByCategory.rocket.push(currentEmoji.name);
				emoji.packages.emojiCustom.list.push(`:${currentEmoji.name}:`);
				emoji.list[`:${currentEmoji.name}:`] = currentEmoji;
				emoji.list[`:${currentEmoji.name}:`].emojiPackage = 'emojiCustom';
				for (const alias of currentEmoji.aliases) {
					emoji.packages.emojiCustom.list.push(`:${alias}:`);
					emoji.list[`:${alias}:`] = {
						emojiPackage: 'emojiCustom',
						aliasOf: currentEmoji.name,
					};
				}
			}

			EmojiPicker.updateRecent('rocket');
		} catch (e) {
			console.error('Error getting custom emoji', e);
		}
	}),
);
