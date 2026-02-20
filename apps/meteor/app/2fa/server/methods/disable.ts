import { Meteor } from 'meteor/meteor';
import { Authorization } from '@rocket.chat/core-services';

declare module '@rocket.chat/ddp-client' {
    interface ServerMethods {
        '2fa:disable': (code: string) => Promise<boolean>;
    }
}

Meteor.methods({
    async '2fa:disable'(code: string) {
        const userId = Meteor.userId();
        
        if (!userId) {
            throw new Meteor.Error('not-authorized');
        }

        return Authorization.disable2FA(userId, code);
    },
});