/* globals getEmojiUrlFromName:true, updateEmojiCustom:true, deleteEmojiCustom:true, isSetNotNull, RoomManager */
RocketChat.emoji.packages.emojiCustom = {
	emojiCategories: { rocket: TAPi18n.__('Custom') },
	toneList: {},
	list: [],

	render: function(html) {
		let regShortNames = new RegExp('<object[^>]*>.*?<\/object>|<span[^>]*>.*?<\/span>|<(?:object|embed|svg|img|div|span|p|a)[^>]*>|(' + RocketChat.emoji.packages.emojiCustom.list.join('|') + ')', 'gi');

		// replace regular shortnames first
		html = html.replace(regShortNames, function(shortname) {
			// console.log('shortname (preif) ->', shortname, html);
			if ((typeof shortname === 'undefined') || (shortname === '') || (RocketChat.emoji.packages.emojiCustom.list.indexOf(shortname) === -1)) {
				// if the shortname doesnt exist just return the entire match
				return shortname;
			} else {
				let emojiAlias = shortname.replace(/:/g, '');

				let dataCheck = RocketChat.emoji.list[shortname];
				if (dataCheck.hasOwnProperty('aliasOf')) {
					emojiAlias = dataCheck['aliasOf'];
					dataCheck = RocketChat.emoji.list[`:${emojiAlias}:`];
				}

				return `<span class="emoji" style="background-image:url(${getEmojiUrlFromName(emojiAlias, dataCheck['extension'])});" data-emoji="${emojiAlias}" title="${shortname}">${shortname}</span>`;
			}
		});

		return html;
	}
};

getEmojiUrlFromName = function(name, extension) {
	Session.get;

	let key = `emoji_random_${name}`;

	let random = 0;
	if (isSetNotNull(() => Session.keys[key])) {
		random = Session.keys[key];
	}

	if (name == null) {
		return;
	}
	let path = (Meteor.isCordova) ? Meteor.absoluteUrl().replace(/\/$/, '') : __meteor_runtime_config__.ROOT_URL_PATH_PREFIX || '';
	return `${path}/emoji-custom/${encodeURIComponent(name)}.${extension}?_dc=${random}`;
};

Blaze.registerHelper('emojiUrlFromName', getEmojiUrlFromName);

function updateEmojiPickerList() {
	let html = '';
	for (let entry of RocketChat.emoji.packages.emojiCustom.emojisByCategory.rocket) {
		let renderedEmoji = RocketChat.emoji.packages.emojiCustom.render(`:${entry}:`);
		html += `<li class="emoji-${entry}" data-emoji="${entry}">${renderedEmoji}</li>`;
	}
	$('.rocket.emoji-list').empty().append(html);
	RocketChat.EmojiPicker.updateRecent();
}

deleteEmojiCustom = function(emojiData) {
	delete RocketChat.emoji.list[`:${emojiData.name}:`];
	let arrayIndex = RocketChat.emoji.packages.emojiCustom.emojisByCategory.rocket.indexOf(emojiData.name);
	if (arrayIndex !== -1) {
		RocketChat.emoji.packages.emojiCustom.emojisByCategory.rocket.splice(arrayIndex, 1);
	}
	let arrayIndexList = RocketChat.emoji.packages.emojiCustom.list.indexOf(`:${emojiData.name}:`);
	if (arrayIndexList !== -1) {
		RocketChat.emoji.packages.emojiCustom.list.splice(arrayIndexList, 1);
	}
	if (isSetNotNull(() => emojiData.aliases)) {
		for (let alias of emojiData.aliases) {
			delete RocketChat.emoji.list[`:${alias}:`];
			let aliasIndex = RocketChat.emoji.packages.emojiCustom.list.indexOf(`:${alias}:`);
			if (aliasIndex !== -1) {
				RocketChat.emoji.packages.emojiCustom.list.splice(aliasIndex, 1);
			}
		}
	}
	updateEmojiPickerList();
};

updateEmojiCustom = function(emojiData) {
	let key = `emoji_random_${emojiData.name}`;
	Session.set(key, Math.round(Math.random() * 1000));

	let previousExists = isSetNotNull(() => emojiData.previousName);
	let currentAliases = isSetNotNull(() => emojiData.aliases);

	if (previousExists && isSetNotNull(() => RocketChat.emoji.list[`:${emojiData.previousName}:`].aliases)) {
		for (let alias of RocketChat.emoji.list[`:${emojiData.previousName}:`].aliases) {
			delete RocketChat.emoji.list[`:${alias}:`];
			let aliasIndex = RocketChat.emoji.packages.emojiCustom.list.indexOf(`:${alias}:`);
			if (aliasIndex !== -1) {
				RocketChat.emoji.packages.emojiCustom.list.splice(aliasIndex, 1);
			}
		}
	}

	if (previousExists && emojiData.name !== emojiData.previousName) {
		let arrayIndex = RocketChat.emoji.packages.emojiCustom.emojisByCategory.rocket.indexOf(emojiData.previousName);
		if (arrayIndex !== -1) {
			RocketChat.emoji.packages.emojiCustom.emojisByCategory.rocket.splice(arrayIndex, 1);
		}
		let arrayIndexList = RocketChat.emoji.packages.emojiCustom.list.indexOf(`:${emojiData.previousName}:`);
		if (arrayIndexList !== -1) {
			RocketChat.emoji.packages.emojiCustom.list.splice(arrayIndexList, 1);
		}
		delete RocketChat.emoji.list[`:${emojiData.previousName}:`];
	}

	let categoryIndex = RocketChat.emoji.packages.emojiCustom.emojisByCategory.rocket.indexOf(`${emojiData.name}`);
	if (categoryIndex === -1) {
		RocketChat.emoji.packages.emojiCustom.emojisByCategory.rocket.push(`${emojiData.name}`);
		RocketChat.emoji.packages.emojiCustom.list.push(`:${emojiData.name}:`);
	}
	RocketChat.emoji.list[`:${emojiData.name}:`] = Object.assign({ emojiPackage: 'emojiCustom' }, RocketChat.emoji.list[`:${emojiData.name}:`], emojiData);
	if (currentAliases) {
		for (let alias of emojiData.aliases) {
			RocketChat.emoji.packages.emojiCustom.list.push(`:${alias}:`);
			RocketChat.emoji.list[`:${alias}:`] = {};
			RocketChat.emoji.list[`:${alias}:`].emojiPackage = 'emojiCustom';
			RocketChat.emoji.list[`:${alias}:`].aliasOf = emojiData.name;
		}
	}

	let url = getEmojiUrlFromName(emojiData.name, emojiData.extension);

	//update in admin interface
	if (previousExists && emojiData.name !== emojiData.previousName) {
		$(document).find(`.emojiAdminPreview-image[data-emoji='${emojiData.previousName}']`).css('background-image', `url('${url})'`).attr('data-emoji', `${emojiData.name}`);
	} else {
		$(document).find(`.emojiAdminPreview-image[data-emoji='${emojiData.name}']`).css('background-image', `url('${url}')`);
	}

	//update in picker
	if (previousExists && emojiData.name !== emojiData.previousName) {
		$(document).find(`li[data-emoji='${emojiData.previousName}'] span`).css('background-image', `url('${url}')`).attr('data-emoji', `${emojiData.name}`);
		$(document).find(`li[data-emoji='${emojiData.previousName}']`).attr('data-emoji', `${emojiData.name}`).attr('class', `emoji-${emojiData.name}`);
	} else {
		$(document).find(`li[data-emoji='${emojiData.name}'] span`).css('background-image', `url('${url}')`);
	}

	//update in picker and opened rooms
	for (key in RoomManager.openedRooms) {
		if (RoomManager.openedRooms.hasOwnProperty(key)) {
			let room = RoomManager.openedRooms[key];
			if (previousExists && emojiData.name !== emojiData.previousName) {
				$(room.dom).find(`span[data-emoji='${emojiData.previousName}']`).css('background-image', `url('${url}')`).attr('data-emoji', `${emojiData.name}`);
			} else {
				$(room.dom).find(`span[data-emoji='${emojiData.name}']`).css('background-image', `url('${url}')`);
			}
		}
	}

	updateEmojiPickerList();
};

Meteor.startup(() =>
	Meteor.call('listEmojiCustom', (error, result) => {
		RocketChat.emoji.packages.emojiCustom.emojisByCategory = { rocket: [] };
		for (let emoji of result) {
			RocketChat.emoji.packages.emojiCustom.emojisByCategory.rocket.push(emoji.name);
			RocketChat.emoji.packages.emojiCustom.list.push(`:${emoji.name}:`);
			RocketChat.emoji.list[`:${emoji.name}:`] = emoji;
			RocketChat.emoji.list[`:${emoji.name}:`].emojiPackage = 'emojiCustom';
			for (let alias of emoji['aliases']) {
				RocketChat.emoji.packages.emojiCustom.list.push(`:${alias}:`);
				RocketChat.emoji.list[`:${alias}:`] = {
					emojiPackage: 'emojiCustom',
					aliasOf: emoji.name
				};
			}
		}
	})
);

/* exported getEmojiUrlFromName, updateEmojiCustom, deleteEmojiCustom */
