// emoji.json from emojione@2.2.6
import fs from 'fs';

var emojiList = JSON.parse(fs.readFileSync('emoji.json', 'utf-8'));

/**
 * update emojiList variable with the most recent emojione release then
 * run: node generateEmojiIndex.js
 * grab the results and put into emojiPicker.js file
 */

var toneList = {};
var emojisByCategory = {};

for (var emoji in emojiList) {
	if(emojiList.hasOwnProperty(emoji)) {
		var toneIndex = emoji.indexOf('_tone');
		if (toneIndex !== -1) {
			toneList[emoji.substr(0, toneIndex)] = 1;
			continue;
		}

		if (!emojisByCategory[emojiList[emoji].category]) {
			emojisByCategory[emojiList[emoji].category] = [];
		}
		emojisByCategory[emojiList[emoji].category].push(emoji);
	}
}

console.log('toneList = ' + JSON.stringify(toneList, null, '\t') + ';');
console.log('emojisByCategory = ' + JSON.stringify(emojisByCategory, null, '\t') + ';');
