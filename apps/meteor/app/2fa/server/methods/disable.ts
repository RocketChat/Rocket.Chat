import { Meteor } from 'meteor/meteor';
import { Authorization } from '@rocket.chat/core-services';
import { notifyOnUserChange } from '../../../lib/server/lib/notifyListener';

Meteor.methods({
    async '2fa:disable'(code: string) {
        const userId = Meteor.userId();
        if (!userId) throw new Meteor.Error('not-authorized');

        const result = await Authorization.disable2FA(userId, code);

        if (result) {
            void notifyOnUserChange({ 
                clientAction: 'updated', 
                id: userId, 
                diff: { 'services.totp.enabled': false } 
            });
        }
        return result;
    },
});