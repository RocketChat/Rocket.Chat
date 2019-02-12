import { Meteor } from 'meteor/meteor';
import { Blaze } from 'meteor/blaze';
import { Session } from 'meteor/session';
import { RocketChat } from 'meteor/rocketchat:lib';
import { isSetNotNull } from '../lib/function-isSet';
import { RoomManager } from 'meteor/rocketchat:ui';
import { call } from 'meteor/rocketchat:ui-utils';

export const getEmojiUrlFromName = function(name, extension) {
	Session.get;

	const key = `emoji_random_${ name }`;

	let random = 0;
	if (isSetNotNull(() => Session.keys[key])) {
		random = Session.keys[key];
	}

	if (name == null) {
		return;
	}
	const path = __meteor_runtime_config__.ROOT_URL_PATH_PREFIX || '';
	return `${ path }/emoji-custom/${ encodeURIComponent(name) }.${ extension }?_dc=${ random }`;
};

Blaze.registerHelper('emojiUrlFromName', getEmojiUrlFromName);

export const deleteEmojiCustom = function(emojiData) {
	delete RocketChat.emoji.list[`:${ emojiData.name }:`];
	const arrayIndex = RocketChat.emoji.packages.emojiCustom.emojisByCategory.rocket.indexOf(emojiData.name);
	if (arrayIndex !== -1) {
		RocketChat.emoji.packages.emojiCustom.emojisByCategory.rocket.splice(arrayIndex, 1);
	}
	const arrayIndexList = RocketChat.emoji.packages.emojiCustom.list.indexOf(`:${ emojiData.name }:`);
	if (arrayIndexList !== -1) {
		RocketChat.emoji.packages.emojiCustom.list.splice(arrayIndexList, 1);
	}
	if (isSetNotNull(() => emojiData.aliases)) {
		for (const alias of emojiData.aliases) {
			delete RocketChat.emoji.list[`:${ alias }:`];
			const aliasIndex = RocketChat.emoji.packages.emojiCustom.list.indexOf(`:${ alias }:`);
			if (aliasIndex !== -1) {
				RocketChat.emoji.packages.emojiCustom.list.splice(aliasIndex, 1);
			}
		}
	}
	RocketChat.EmojiPicker.updateRecent();
};

export const updateEmojiCustom = function(emojiData) {
	let key = `emoji_random_${ emojiData.name }`;
	Session.set(key, Math.round(Math.random() * 1000));

	const previousExists = isSetNotNull(() => emojiData.previousName);
	const currentAliases = isSetNotNull(() => emojiData.aliases);

	if (previousExists && isSetNotNull(() => RocketChat.emoji.list[`:${ emojiData.previousName }:`].aliases)) {
		for (const alias of RocketChat.emoji.list[`:${ emojiData.previousName }:`].aliases) {
			delete RocketChat.emoji.list[`:${ alias }:`];
			const aliasIndex = RocketChat.emoji.packages.emojiCustom.list.indexOf(`:${ alias }:`);
			if (aliasIndex !== -1) {
				RocketChat.emoji.packages.emojiCustom.list.splice(aliasIndex, 1);
			}
		}
	}

	if (previousExists && emojiData.name !== emojiData.previousName) {
		const arrayIndex = RocketChat.emoji.packages.emojiCustom.emojisByCategory.rocket.indexOf(emojiData.previousName);
		if (arrayIndex !== -1) {
			RocketChat.emoji.packages.emojiCustom.emojisByCategory.rocket.splice(arrayIndex, 1);
		}
		const arrayIndexList = RocketChat.emoji.packages.emojiCustom.list.indexOf(`:${ emojiData.previousName }:`);
		if (arrayIndexList !== -1) {
			RocketChat.emoji.packages.emojiCustom.list.splice(arrayIndexList, 1);
		}
		delete RocketChat.emoji.list[`:${ emojiData.previousName }:`];
	}

	const categoryIndex = RocketChat.emoji.packages.emojiCustom.emojisByCategory.rocket.indexOf(`${ emojiData.name }`);
	if (categoryIndex === -1) {
		RocketChat.emoji.packages.emojiCustom.emojisByCategory.rocket.push(`${ emojiData.name }`);
		RocketChat.emoji.packages.emojiCustom.list.push(`:${ emojiData.name }:`);
	}
	RocketChat.emoji.list[`:${ emojiData.name }:`] = Object.assign({ emojiPackage: 'emojiCustom' }, RocketChat.emoji.list[`:${ emojiData.name }:`], emojiData);
	if (currentAliases) {
		for (const alias of emojiData.aliases) {
			RocketChat.emoji.packages.emojiCustom.list.push(`:${ alias }:`);
			RocketChat.emoji.list[`:${ alias }:`] = {};
			RocketChat.emoji.list[`:${ alias }:`].emojiPackage = 'emojiCustom';
			RocketChat.emoji.list[`:${ alias }:`].aliasOf = emojiData.name;
		}
	}

	const url = getEmojiUrlFromName(emojiData.name, emojiData.extension);

	// update in admin interface
	if (previousExists && emojiData.name !== emojiData.previousName) {
		$(document).find(`.emojiAdminPreview-image[data-emoji='${ emojiData.previousName }']`).css('background-image', `url('${ url })'`).attr('data-emoji', `${ emojiData.name }`);
	} else {
		$(document).find(`.emojiAdminPreview-image[data-emoji='${ emojiData.name }']`).css('background-image', `url('${ url }')`);
	}

	// update in picker
	if (previousExists && emojiData.name !== emojiData.previousName) {
		$(document).find(`li[data-emoji='${ emojiData.previousName }'] span`).css('background-image', `url('${ url }')`).attr('data-emoji', `${ emojiData.name }`);
		$(document).find(`li[data-emoji='${ emojiData.previousName }']`).attr('data-emoji', `${ emojiData.name }`).attr('class', `emoji-${ emojiData.name }`);
	} else {
		$(document).find(`li[data-emoji='${ emojiData.name }'] span`).css('background-image', `url('${ url }')`);
	}

	// update in picker and opened rooms
	for (key in RoomManager.openedRooms) {
		if (RoomManager.openedRooms.hasOwnProperty(key)) {
			const room = RoomManager.openedRooms[key];
			if (previousExists && emojiData.name !== emojiData.previousName) {
				$(room.dom).find(`span[data-emoji='${ emojiData.previousName }']`).css('background-image', `url('${ url }')`).attr('data-emoji', `${ emojiData.name }`);
			} else {
				$(room.dom).find(`span[data-emoji='${ emojiData.name }']`).css('background-image', `url('${ url }')`);
			}
		}
	}

	RocketChat.EmojiPicker.updateRecent();
};

RocketChat.emoji.packages.emojiCustom = {
	emojiCategories: { rocket: 'Custom' },
	toneList: {},
	list: [],
	_regexpSignature: null,
	_regexp: null,

	render(html) {
		const emojisMatchGroup = RocketChat.emoji.packages.emojiCustom.list.map(RegExp.escape).join('|');
		if (emojisMatchGroup !== RocketChat.emoji.packages.emojiCustom._regexpSignature) {
			RocketChat.emoji.packages.emojiCustom._regexpSignature = emojisMatchGroup;
			RocketChat.emoji.packages.emojiCustom._regexp = new RegExp(`<object[^>]*>.*?<\/object>|<span[^>]*>.*?<\/span>|<(?:object|embed|svg|img|div|span|p|a)[^>]*>|(${ emojisMatchGroup })`, 'gi');
		}

		html = html.replace(RocketChat.emoji.packages.emojiCustom._regexp, (shortname) => {
			if ((typeof shortname === 'undefined') || (shortname === '') || (RocketChat.emoji.packages.emojiCustom.list.indexOf(shortname) === -1)) {
				return shortname;
			}

			let emojiAlias = shortname.replace(/:/g, '');

			let dataCheck = RocketChat.emoji.list[shortname];
			if (dataCheck.hasOwnProperty('aliasOf')) {
				emojiAlias = dataCheck.aliasOf;
				dataCheck = RocketChat.emoji.list[`:${ emojiAlias }:`];
			}

			return `<span class="emoji" style="background-image:url(${ getEmojiUrlFromName(emojiAlias, dataCheck.extension) });" data-emoji="${ emojiAlias }" title="${ shortname }">${ shortname }</span>`;
		});

		return html;
	},
};

Meteor.startup(() =>
	RocketChat.CachedCollectionManager.onLogin(async() => {
		const emojis = await call('listEmojiCustom');

		RocketChat.emoji.packages.emojiCustom.emojisByCategory = { rocket: [] };
		for (const emoji of emojis) {
			RocketChat.emoji.packages.emojiCustom.emojisByCategory.rocket.push(emoji.name);
			RocketChat.emoji.packages.emojiCustom.list.push(`:${ emoji.name }:`);
			RocketChat.emoji.list[`:${ emoji.name }:`] = emoji;
			RocketChat.emoji.list[`:${ emoji.name }:`].emojiPackage = 'emojiCustom';
			for (const alias of emoji.aliases) {
				RocketChat.emoji.packages.emojiCustom.list.push(`:${ alias }:`);
				RocketChat.emoji.list[`:${ alias }:`] = {
					emojiPackage: 'emojiCustom',
					aliasOf: emoji.name,
				};
			}
		}
	})
);
