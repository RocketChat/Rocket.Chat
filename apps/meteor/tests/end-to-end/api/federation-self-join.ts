import type { Credentials } from '@rocket.chat/api-client';
import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { after, before, describe, it } from 'mocha';

import { getCredentials, api, request, credentials } from '../../data/api-data';
import { updatePermission, updateSetting } from '../../data/permissions.helper';
import { createRoom, deleteRoom } from '../../data/rooms.helper';
import { password } from '../../data/user';
import type { TestUser } from '../../data/users.helper';
import { createUser, login, deleteUser } from '../../data/users.helper';
import { IS_EE } from '../../e2e/config/constants';

/**
 * Federation self-join e2e tests.
 *
 * These tests verify that when a user self-joins a federated room
 * (via channels.join API without being explicitly invited), they are
 * properly registered on the Matrix homeserver and can send messages
 * that are visible to federated users.
 *
 * Related issue: https://github.com/RocketChat/Rocket.Chat/issues/38239
 */
(IS_EE ? describe : describe.skip)('federation - self-join', () => {
    before((done) => getCredentials(done));

    describe('when a user self-joins a federated room via channels.join', () => {
        let federatedRoom: IRoom;
        let testUser: TestUser<IUser>;
        let testUserCredentials: Credentials;

        before('Enable federation and create test data', async () => {
            // Enable federation
            await updateSetting('Federation_Service_Enabled', true);

            // Grant access-federation to user role
            await updatePermission('access-federation', ['admin', 'user']);

            // Create a test user
            testUser = await createUser();
            testUserCredentials = await login(testUser.username, password);

            // Create a federated room (admin creates it with federation enabled)
            const roomResponse = await createRoom({
                type: 'c',
                name: `federation-self-join-test-${Date.now()}`,
                extraData: {
                    federated: true,
                },
            });
            federatedRoom = roomResponse.body.channel;
        });

        after(async () => {
            await Promise.all([
                deleteRoom({ type: 'c', roomId: federatedRoom._id }),
                deleteUser(testUser),
                updateSetting('Federation_Service_Enabled', false),
                updatePermission('access-federation', ['admin']),
            ]);
        });

        it('should verify the room is federated', async () => {
            const res = await request
                .get(api('channels.info'))
                .set(credentials)
                .query({ roomId: federatedRoom._id })
                .expect('Content-Type', 'application/json')
                .expect(200);

            expect(res.body).to.have.property('success', true);
            expect(res.body).to.have.property('channel');
            expect(res.body.channel).to.have.property('federated', true);
        });

        it('should allow a user to self-join the federated room', async () => {
            const res = await request
                .post(api('channels.join'))
                .set(testUserCredentials)
                .send({ roomId: federatedRoom._id })
                .expect('Content-Type', 'application/json')
                .expect(200);

            expect(res.body).to.have.property('success', true);
            expect(res.body).to.have.nested.property('channel._id', federatedRoom._id);
        });

        it('should create a subscription for the self-joined user', async () => {
            const res = await request
                .get(api('subscriptions.getOne'))
                .set(testUserCredentials)
                .query({ roomId: federatedRoom._id })
                .expect('Content-Type', 'application/json')
                .expect(200);

            expect(res.body).to.have.property('success', true);
            expect(res.body).to.have.property('subscription');
            expect(res.body.subscription).to.have.property('rid', federatedRoom._id);
        });

        it('should show the self-joined user as a member of the federated room', async () => {
            const res = await request
                .get(api('channels.members'))
                .set(credentials)
                .query({ roomId: federatedRoom._id })
                .expect('Content-Type', 'application/json')
                .expect(200);

            expect(res.body).to.have.property('success', true);
            expect(res.body).to.have.property('members').that.is.an('array');

            const member = res.body.members.find((m: IUser) => m._id === testUser._id);
            expect(member, 'Self-joined user should appear in room members').to.not.be.undefined;
        });

        it('should allow the self-joined user to send messages in the federated room', async () => {
            const messageText = `federation self-join test message ${Date.now()}`;
            const res = await request
                .post(api('chat.sendMessage'))
                .set(testUserCredentials)
                .send({
                    message: {
                        rid: federatedRoom._id,
                        msg: messageText,
                    },
                })
                .expect('Content-Type', 'application/json')
                .expect(200);

            expect(res.body).to.have.property('success', true);
            expect(res.body).to.have.property('message');
            expect(res.body.message).to.have.property('msg', messageText);
            expect(res.body.message).to.have.property('rid', federatedRoom._id);
        });

        it('should have the self-joined user message visible in room history', async () => {
            const res = await request
                .get(api('channels.history'))
                .set(credentials)
                .query({ roomId: federatedRoom._id })
                .expect('Content-Type', 'application/json')
                .expect(200);

            expect(res.body).to.have.property('success', true);
            expect(res.body).to.have.property('messages').that.is.an('array');

            const userMessages = res.body.messages.filter(
                (m: { u: { _id: string }; t?: string }) => m.u._id === testUser._id && !m.t,
            );
            expect(userMessages.length, 'Self-joined user should have at least one message in history').to.be.greaterThan(0);
        });

        it('should mark the self-joined user as federated in the user record', async () => {
            // This is the critical test: after self-joining a federated room,
            // the user should have federation metadata indicating they were
            // registered on the Matrix homeserver.
            const res = await request
                .get(api('users.info'))
                .set(credentials)
                .query({ userId: testUser._id })
                .expect('Content-Type', 'application/json')
                .expect(200);

            expect(res.body).to.have.property('success', true);
            expect(res.body).to.have.property('user');

            // The user should have federation data after joining a federated room.
            // Currently this FAILS because the beforeAddUserToRoom callback
            // skips federation registration when there's no inviter (self-join).
            expect(res.body.user).to.have.property('federated', true);
            expect(res.body.user).to.have.property('federation');
        });
    });

    describe('comparison: invited user vs self-joined user in federated room', () => {
        let federatedRoom: IRoom;
        let invitedUser: TestUser<IUser>;
        let selfJoinedUser: TestUser<IUser>;
        let selfJoinedUserCredentials: Credentials;

        before('Enable federation and create test data', async () => {
            await updateSetting('Federation_Service_Enabled', true);
            await updatePermission('access-federation', ['admin', 'user']);

            invitedUser = await createUser();
            selfJoinedUser = await createUser();
            selfJoinedUserCredentials = await login(selfJoinedUser.username, password);

            // Create a federated room
            const roomResponse = await createRoom({
                type: 'c',
                name: `federation-compare-test-${Date.now()}`,
                extraData: {
                    federated: true,
                },
            });
            federatedRoom = roomResponse.body.channel;

            // Explicitly invite one user (this works correctly)
            await request
                .post(api('channels.invite'))
                .set(credentials)
                .send({
                    roomId: federatedRoom._id,
                    userId: invitedUser._id,
                })
                .expect(200);

            // Let the other user self-join (this is the broken flow)
            await request
                .post(api('channels.join'))
                .set(selfJoinedUserCredentials)
                .send({
                    roomId: federatedRoom._id,
                })
                .expect(200);
        });

        after(async () => {
            await Promise.all([
                deleteRoom({ type: 'c', roomId: federatedRoom._id }),
                deleteUser(invitedUser),
                deleteUser(selfJoinedUser),
                updateSetting('Federation_Service_Enabled', false),
                updatePermission('access-federation', ['admin']),
            ]);
        });

        it('should show both invited and self-joined users as members', async () => {
            const res = await request
                .get(api('channels.members'))
                .set(credentials)
                .query({ roomId: federatedRoom._id })
                .expect('Content-Type', 'application/json')
                .expect(200);

            expect(res.body).to.have.property('success', true);

            const invitedMember = res.body.members.find((m: IUser) => m._id === invitedUser._id);
            const selfJoinedMember = res.body.members.find((m: IUser) => m._id === selfJoinedUser._id);

            expect(invitedMember, 'Invited user should be a member').to.not.be.undefined;
            expect(selfJoinedMember, 'Self-joined user should be a member').to.not.be.undefined;
        });

        it('should have federation metadata for invited user', async () => {
            const res = await request
                .get(api('users.info'))
                .set(credentials)
                .query({ userId: invitedUser._id })
                .expect(200);

            expect(res.body.user).to.have.property('federated', true);
            expect(res.body.user).to.have.property('federation');
        });

        it('should have federation metadata for self-joined user (currently fails)', async () => {
            // This test demonstrates the bug: self-joined users do NOT get
            // federation metadata, meaning they are not registered on the
            // Matrix homeserver and their messages won't federate.
            const res = await request
                .get(api('users.info'))
                .set(credentials)
                .query({ userId: selfJoinedUser._id })
                .expect(200);

            // This assertion currently FAILS - self-joined users should
            // have the same federation status as invited users.
            expect(res.body.user).to.have.property('federated', true);
            expect(res.body.user).to.have.property('federation');
        });
    });
});
