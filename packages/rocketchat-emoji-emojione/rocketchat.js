/* globals emojione, emojisByCategory, emojiCategories, toneList */
RocketChat.emoji.packages.emojione = emojione;
RocketChat.emoji.packages.emojione.imageType = 'png';
RocketChat.emoji.packages.emojione.sprites = true;
RocketChat.emoji.packages.emojione.emojisByCategory = emojisByCategory;
RocketChat.emoji.packages.emojione.emojiCategories = emojiCategories;
RocketChat.emoji.packages.emojione.toneList = toneList;

// To convert (y)/(Y) to the thumbsup emoji
function thumbsupConvert(emoji) {
	emoji = emoji.replace(/^\(y\)$/i, ':thumbsup:');
	emoji = emoji.replace(/^\(y\)\s+/i, ':thumbsup: ');
	emoji = emoji.replace(/\s+\(y\)$/i, ' :thumbsup:');
	emoji = emoji.replace(/\s+\(y\)\s+/gi, ' :thumbsup: ');

	emoji = emoji.replace(/^(\(y\))([.|,|!|?])/i, function($1, $2, $3) {
		if ($2 === '(y)' || $2 === '(Y)') {
			return `:thumbsup:${ $3 }`;
		}
	});

	emoji = emoji.replace(/\s+(\(y\))([.|,|!|?])/gi, function($1, $2, $3) {
		if ($2 === '(y)' || $2 === '(Y)') {
			return ` :thumbsup:${ $3 }`;
		}
	});

	return emoji;
}

RocketChat.emoji.packages.emojione.render = function(emoji) {
	return emojione.toImage(thumbsupConvert(emoji));
};

//http://stackoverflow.com/a/26990347 function isSet() from Gajus
function isSetNotNull(fn) {
	let value;
	try {
		value = fn();
	} catch (e) {
		value = null;
	} finally {
		return value !== null && value !== undefined;
	}
}

// RocketChat.emoji.list is the collection of emojis from all emoji packages
for (const key in emojione.emojioneList) {
	if (emojione.emojioneList.hasOwnProperty(key)) {
		const emoji = emojione.emojioneList[key];
		emoji.emojiPackage = 'emojione';
		RocketChat.emoji.list[key] = emoji;
	}
}

// Additional settings -- ascii emojis
Meteor.startup(function() {
	Tracker.autorun(function() {
		if (isSetNotNull(() => RocketChat.emoji.packages.emojione)) {
			if (isSetNotNull(() => RocketChat.getUserPreference(Meteor.user(), 'convertAsciiEmoji'))) {
				RocketChat.emoji.packages.emojione.ascii = RocketChat.getUserPreference(Meteor.user(), 'convertAsciiEmoji');
			} else {
				RocketChat.emoji.packages.emojione.ascii = true;
			}
		}
	});
});
