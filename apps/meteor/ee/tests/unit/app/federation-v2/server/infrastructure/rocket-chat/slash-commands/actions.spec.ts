/* eslint-disable */
import proxyquire from 'proxyquire';
import { expect } from 'chai';
import sinon from 'sinon';
import { IUser } from '@rocket.chat/core-typings';

const { executeSlashCommand } = proxyquire.noCallThru().load('../../../../../../../../app/federation-v2/server/infrastructure/rocket-chat/slash-commands/action', {
	'@rocket.chat/models': {
		Users: {
			findOneById: async (invitee: string): Promise<IUser | undefined> => {
				if (invitee.includes('normalUser')) {
					return { username: 'username' } as any;
				}
			},
		},
	}
});

describe('FederationEE - Infrastructure - RocketChat - Server Slash command', () => {
	const command = sinon.stub();

	describe('#executeSlashCommand()', () => {
		const validCommands = {
			dm: async (currentUserId: string, roomId: string, invitees: string[]) => command(currentUserId, roomId, invitees),
		};
		const currentUserId = 'userId';

		it('should return undefined if the provided command is different of "federation"', async () => {
			expect(await executeSlashCommand('invalid-command', '', {}, validCommands)).to.be.equal(undefined);
		});

		it('should return undefined if the command is valid but there is no string params', async () => {
			expect(await executeSlashCommand('federation', '', {}, validCommands)).to.be.equal(undefined);
		});

		it('should return undefined if there is no currentUserId', async () => {
			expect(await executeSlashCommand('federation', 'params', {}, validCommands)).to.be.equal(undefined);
		});

		it('should return undefined if the provided command is invalid/inexistent', async () => {
			expect(await executeSlashCommand('federation', 'params', {}, validCommands)).to.be.equal(undefined);
		});

		it('should throw an error if the provided invitee is invalid (without any ":")', async () => {
			try {
				await executeSlashCommand('federation', 'dm @user.server.com', {}, validCommands, currentUserId);
			} catch (e: any) {
				expect(e.message).to.be.equal('At least one user must be external');
			}
		});

		it('should throw an error if the inviter does not exist', async () => {
			try {
				await executeSlashCommand('federation', 'dm @user:server.com', {}, validCommands, currentUserId);
			} catch (e: any) {
				expect(e.message).to.be.equal('At least one user must be external');
			}
		});

		it('should throw an error if there is no external users', async () => {
			try {
				await executeSlashCommand('federation', 'dm @user1 @user2', {}, validCommands, currentUserId);
			} catch (e: any) {
				expect(e.message).to.be.equal('At least one user must be external');
			}
		});

		it('should throw an error if the LOCAL inviter is trying to invite another LOCAL user', async () => {
			try {
				await executeSlashCommand('federation', 'dm @normalUser:server.com', {}, validCommands, currentUserId);
			} catch (e: any) {
				expect(e.message).to.be.equal('At least one user must be external');
			}
		});

		it('should call the command function without any error', async () => {
			await executeSlashCommand('federation', 'dm @external:server.com', { rid: 'roomId' }, validCommands, currentUserId);
			expect(command.calledWith(currentUserId, 'roomId', ['@external:server.com'])).to.be.true;
		});
	});
});
