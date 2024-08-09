const emojiUnicode = '\u00a9|\u00ae|[\u2000-\u3039]|[\u3100-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff]'; // unicode emoji from https://www.regextester.com/106421

const emojiRanges = [
	emojiUnicode, // unicode emoji from https://www.regextester.com/106421
	':.{1,40}:', // custom emoji
	' |\n', // allow spaces and line breaks
].join('|');

const removeSpaces = (str: string) => str.replace(/\s/g, '');

const removeAllEmoji = (str: string) => str.replace(new RegExp(emojiRanges, 'g'), '');

export default (str: string) => {
	str = removeSpaces(str);
	return !removeAllEmoji(str).length;
};
