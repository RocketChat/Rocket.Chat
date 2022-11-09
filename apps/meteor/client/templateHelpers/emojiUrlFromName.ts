import { Template } from 'meteor/templating';

import { getEmojiUrlFromName } from '../../app/emoji-custom/client/lib/emojiCustom';

Template.registerHelper('emojiUrlFromName', getEmojiUrlFromName);
