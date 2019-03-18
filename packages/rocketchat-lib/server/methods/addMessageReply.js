import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';
import moment from 'moment';
import { Messages } from 'meteor/rocketchat:models';
import { addMessageReply } from '../functions';

Meteor.methods({
    addMessageReply(message) {
        check(message, Match.ObjectIncluding({ _id: String }));

        if (!Meteor.userId()) {
            throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'addMessageReply' });
        }

        const originalMessage = Messages.findOneById(message._id);

        if (!originalMessage || !originalMessage._id) {
            return;
        }

        message.u = originalMessage.u;

        return addMessageReply(message, Meteor.user(), originalMessage);
    },
});