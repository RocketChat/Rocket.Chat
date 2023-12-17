import { Meteor } from 'meteor/meteor';

import { Notifications } from '../../../notifications/client';
import { deleteEmojiCustom } from '../lib/emojiCustom';

Meteor.startup(() => Notifications.onLogged('deleteEmojiCustom', (data) => deleteEmojiCustom(data.emojiData)));
