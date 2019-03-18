import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import _ from 'underscore';
import { callbacks } from 'meteor/rocketchat:callbacks';
import { ChatMessage } from 'meteor/rocketchat:models';

Meteor.methods({
    addMessageReply(message) {
        if (!Meteor.userId()) {
            return false;
        }

        Tracker.nonreactive(function () {
            message = callbacks.run('beforeSaveMessage', message);
            const messageObject = { customFields: { replyIds: message.customFields.replyIds } };
            ChatMessage.update({
                _id: message._id,
                'u._id': Meteor.userId(),
            }, { $set: messageObject });
        });
    },
});