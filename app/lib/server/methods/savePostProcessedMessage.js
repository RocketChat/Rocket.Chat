import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { Messages } from '../../../models';

Meteor.methods({
    savePostProcessedMessage(_id, message) {
        return Messages.updatePostProcessedPushMessageById(_id, message);
    }
});