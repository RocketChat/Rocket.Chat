import type { Credentials } from '@rocket.chat/api-client';
import { expect } from 'chai';
import { after, before, describe, it } from 'mocha';
import supertest from 'supertest';

import { type RequestConfig } from '../../data/api-data';
import { IS_EE } from '../../e2e/config/constants';
import { federationConfig, SynapseClient } from '../../data/federation-data';
import { createRoom, getRoomInfo, getRoomMembers, getGroupHistory } from '../../data/rooms.helper';
import { login } from '../../data/users.helper';
import { IUser, IMessage } from '@rocket.chat/core-typings';
import { RoomMember } from 'matrix-js-sdk';
// import { KnownMembership } from 'matrix-js-sdk';
// import { t } from 'i18next';

async function getRequestConfig(domain: string, user: string, password: string): Promise<RequestConfig> {
	const request = supertest(domain);
	const credentials = await login(user, password, { request, credentials: {} as Credentials });
	
	return {
		credentials,
		request: request,
	};
}


(IS_EE ? describe : describe.skip)('Federation', function() {

	before(async function() {
		this.rc1RequestConfig = await getRequestConfig(
			federationConfig.rc1.apiUrl,
			federationConfig.rc1.adminUser,
			federationConfig.rc1.adminPassword
		);
		this.hs1App = new SynapseClient(
			federationConfig.hs1.url,
			federationConfig.hs1.adminUser,
			federationConfig.hs1.adminPassword
		);
		await this.hs1App.initialize();

	});

	after(async function() {
		if (this.hs1App) {
			await this.hs1App.close();
		}
	});

	describe('Rooms', function() {
		describe('Create a room on RC as private and federated and: ', function() {

			describe('Add 1 federated user in the creation modal', function() {

				before(async function() {
					this.timeout(10000);
					this.channelName = `federated-channel-${Date.now()}`;

					const createResponse = await createRoom({
						type: 'p',
						name: this.channelName,
						members: [federationConfig.hs1.adminMatrixUserId],
						extraData: {
							federated: true,
						},
						config: this.rc1RequestConfig,
					});
					
					// For private groups, the response has 'group' property, not 'channel'
					this.federatedChannel = createResponse.body.group;

					expect(this.federatedChannel).to.have.property('_id');
					expect(this.federatedChannel).to.have.property('name', this.channelName);
					expect(this.federatedChannel).to.have.property('t', 'p');
					expect(this.federatedChannel).to.have.property('federated', true);
					expect(this.federatedChannel).to.have.property('federation');
					expect((this.federatedChannel as any).federation).to.have.property('version', 1);

					const acceptedRoomId = await this.hs1App.acceptInvitationForRoomName(this.channelName);
					
					expect(acceptedRoomId, 'Expected to accept the invitation, but acceptedRoomId is empty').to.not.be.empty;
					
					// TODO: Figure out why syncing events are not working and uncomment this when we get the state change from
					// invite to join
					// const joinedRoomId = await this.hs1App.getRoomIdByRoomNameAndMembership(channelName, KnownMembership.Join);
					// expect(acceptedRoomId, 'Expected to have joined the room, but joinedRoomId is different from acceptedRoomId').to.equal(joinedRoomId);
				});

				it('It should show the room on the remote Element or RC', async function() {
					// Check in RC
					const roomInfo = await getRoomInfo(this.federatedChannel._id, this.rc1RequestConfig);
					expect(roomInfo.room).to.have.property('_id', this.federatedChannel._id);
					expect(roomInfo.room).to.have.property('federated', true);

					// Check in Element
					const elementRoom = await this.hs1App.getRoom(this.channelName);
					expect(elementRoom).to.have.property('name', this.channelName);
				});

				it('It should show the new user in the members list', async function() {
					// Check in RC that the federated user is in the members list
					const rc1MembersResponse = await getRoomMembers(this.federatedChannel._id, this.rc1RequestConfig);
					expect(rc1MembersResponse.members).to.be.an('array');

					const rc1UserInRC = rc1MembersResponse.members.find((member: IUser) => 
						member.username === federationConfig.rc1.adminUser
					);
					const hs1UserInRC = rc1MembersResponse.members.find((member: IUser) => 
						member.username === federationConfig.hs1.adminMatrixUserId && member.federated
					);
					expect(rc1UserInRC, 'RC1 user should be in the members list in RC').to.not.be.undefined;
					expect(hs1UserInRC, 'HS1 user should be in the members list in RC').to.not.be.undefined;

					// Check in Element (Matrix) that the federated user is in the members list
					const hs1MembersResponse = await this.hs1App.getRoomMembers(this.channelName);
					expect(hs1MembersResponse).to.be.an('array');

					const rc1UserInSynapse = hs1MembersResponse.find((member: RoomMember) => 
						member.userId === federationConfig.rc1.adminMatrixUserId
					);
					const hs1UserInSynapse = hs1MembersResponse.find((member: RoomMember) => 
						member.userId === federationConfig.hs1.adminMatrixUserId
					);
					expect(rc1UserInSynapse, 'RC1 user should be in the members list in Synapse').to.not.be.undefined;
					expect(hs1UserInSynapse, 'HS1 user should be in the members list in Synapse').to.not.be.undefined;
				});

				it('It should show the system message that the user added', async function() {
					// Check in RC. We don't check in Synapse because this is not part of the protocol
					// Get the room history to find the system message
					const historyResponse = await getGroupHistory(this.federatedChannel._id, this.rc1RequestConfig);
					expect(historyResponse.messages).to.be.an('array');

					// Look for a system message about the user joining
					// System messages typically have t: 'uj' (user joined) and the msg contains the username
					const joinMessage = historyResponse.messages.find((message: IMessage) => 
						message.t === 'uj' && 
						message.msg && 
						message.msg === federationConfig.hs1.adminMatrixUserId
					);
					
					expect(joinMessage, 'Should find a system message about the user joining').to.not.be.undefined;
					expect(joinMessage?.msg, 'Join message should contain the user ID').to.include(federationConfig.hs1.adminMatrixUserId);
					expect(joinMessage?.u?.username, 'Join message should have the user in the u field').to.equal(federationConfig.hs1.adminMatrixUserId);
				});
			});
		});
	});
});
