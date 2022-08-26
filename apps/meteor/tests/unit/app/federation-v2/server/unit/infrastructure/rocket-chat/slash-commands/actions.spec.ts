/* eslint-disable */
import proxyquire from 'proxyquire';
import { expect } from 'chai';
import sinon from 'sinon';
import { IUser } from '@rocket.chat/core-typings';

const {
	normalizeExternalInviteeId,
	executeSlashCommand,
} = proxyquire.noCallThru().load('../../../../../../../../../app/federation-v2/server/infrastructure/rocket-chat/slash-commands/action', {
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

describe('Federation - Infrastructure - RocketChat - Server Slash command', () => {
	const command = sinon.stub();

	describe('#normalizeExternalInviteeId()', () => {
		it('should add a "@" in front of the string, removing all "@" in the original string if any', () => {
			expect(normalizeExternalInviteeId('@exter@nal@:server-name.com')).to.be.equal('@external:server-name.com');
		});
	});

	describe('#executeSlashCommand()', () => {
		const validCommands = {
			dm: async (currentUserId: string, roomId: string, invitee: string) => command(currentUserId, roomId, invitee),
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
				expect(e.message).to.be.equal('Invalid userId format for federation command.');
			}
		});

		it('should throw an error if the inviter does not exist', async () => {
			try {
				await executeSlashCommand('federation', 'dm @user:server.com', {}, validCommands, currentUserId);
			} catch (e: any) {
				expect(e.message).to.be.equal('Invalid userId format for federation command.');
			}
		});

		it('should throw an error if the LOCAL inviter is trying to invite another LOCAL user', async () => {
			try {
				await executeSlashCommand('federation', 'dm @normalUser:server.com', {}, validCommands, currentUserId);
			} catch (e: any) {
				expect(e.message).to.be.equal('Invalid userId format for federation command.');
			}
		});

		it('should call the command function without any error', async () => {
			await executeSlashCommand('federation', 'dm @external:server.com', { rid: 'roomId' }, validCommands, currentUserId);
			expect(command.calledWith(currentUserId, 'roomId', '@external:server.com')).to.be.true;
		});
	});
});
