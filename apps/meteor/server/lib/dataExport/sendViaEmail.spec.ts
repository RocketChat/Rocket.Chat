import { expect } from 'chai';
import proxyquire from 'proxyquire';
import Sinon from 'sinon';

const modelsMock = {
    Users: {
        findUsersByUsernames: (usernames: string[]) => ({
            toArray: async () => usernames.map(username => {
                if (username === 'user_valid') {
                    return { _id: '1', username: 'user_valid', emails: [{ address: 'valid@example.com' }] };
                }
                if (username === 'user_empty_emails') {
                    return { _id: '2', username: 'user_empty_emails', emails: [] };
                }
                if (username === 'user_no_emails') {
                    return { _id: '3', username: 'user_no_emails' }; // undefined emails array
                }
                return null;
            }).filter(Boolean),
        }),
    },
    Messages: {
        findByRoomIdAndMessageIds: () => ({
            toArray: async () => [],
        }),
    },
};

const mailerMock = {
    send: Sinon.stub().resolves(),
    checkAddressFormat: () => true,
};

const { sendViaEmail } = proxyquire.noCallThru().load('./sendViaEmail.ts', {
    '@rocket.chat/models': modelsMock,
    '../../../app/mailer/server/api': mailerMock,
    '../../../app/settings/server': {
        settings: {
            get: () => 'noreply@rocketchat.test',
        },
    },
    '../../../app/ui-utils/server': {
        Message: { parse: () => '' },
    },
    '../getMomentLocale': {
        getMomentLocale: async () => null,
    },
});

describe('sendViaEmail', () => {
    beforeEach(() => {
        mailerMock.send.resetHistory();
    });

    it('should process users even if some have empty or undefined emails arrays', async () => {
        const reqData = {
            rid: 'GENERAL',
            toUsers: ['user_valid', 'user_empty_emails', 'user_no_emails'],
            toEmails: ['extra@example.com'],
            subject: 'Test Export',
            messages: [],
            language: 'en',
        };

        const executorUser = { _id: 'admin', username: 'admin', emails: [{ address: 'admin@example.com' }] };

        // Should NOT throw TypeError
        const result = await sendViaEmail(reqData, executorUser as any);

        expect(result.missing).to.include('user_empty_emails');
        expect(result.missing).to.include('user_no_emails');
        expect(result.missing).to.not.include('user_valid');

        expect(mailerMock.send.calledOnce).to.be.true;
        const sendArgs = mailerMock.send.firstCall.args[0];

        expect(sendArgs.to).to.deep.equal(['extra@example.com', 'valid@example.com']);
    });
});
