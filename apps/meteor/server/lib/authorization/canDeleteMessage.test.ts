import { after, before, beforeEach, describe, it } from 'node:test';

import { LocalBroker, ServiceClass, api } from '@rocket.chat/core-services';
import type { IAuthorization } from '@rocket.chat/core-services';
import type { IRoomsModel } from '@rocket.chat/model-typings';
import { registerModel } from '@rocket.chat/models';
import { expect } from 'chai';
import sinon from 'sinon';

import { canDeleteMessageAsync } from './canDeleteMessage';
import { setValue } from '../../settings/raw';

const sandbox = sinon.createSandbox();

const hasPermission = sandbox.stub();
const canAccessRoom = sandbox.stub();
const findRoom = sandbox.stub();

class AuthorizationDouble extends ServiceClass implements Pick<IAuthorization, 'hasPermission' | 'canAccessRoom'> {
	protected name = 'authorization';

	async hasPermission(...args: Parameters<IAuthorization['hasPermission']>) {
		return hasPermission(...args);
	}

	async canAccessRoom(...args: Parameters<IAuthorization['canAccessRoom']>) {
		return canAccessRoom(...args);
	}
}

const authorization = new AuthorizationDouble();

const rid = 'room-id';
const author = { _id: 'author-id', username: 'author' };
const moderator = { _id: 'moderator-id', username: 'moderator' };

const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60 * 1000);
const messageOf = (u: typeof author, ts = minutesAgo(1)) => ({ u, rid, ts });

const grant = (user: typeof author, permission: string) => hasPermission.withArgs(user._id, permission, rid).resolves(true);

describe('canDeleteMessageAsync', () => {
	before(() => {
		api.setBroker(new LocalBroker());
		api.registerService(authorization);
		registerModel('IRoomsModel', { findOneById: findRoom } as unknown as IRoomsModel);
	});

	after(async () => {
		await api.destroyService(authorization);
		setValue('Message_AllowDeleting', true);
		setValue('Message_AllowDeleting_BlockDeleteInMinutes', 0);
	});

	beforeEach(() => {
		sandbox.reset();
		findRoom.resolves({ _id: rid, t: 'c' });
		canAccessRoom.resolves(true);
		setValue('Message_AllowDeleting', true);
		setValue('Message_AllowDeleting_BlockDeleteInMinutes', 0);
	});

	it('should let an author with delete-own-message delete their own message', async () => {
		grant(author, 'delete-own-message');

		expect(await canDeleteMessageAsync(author, messageOf(author))).to.be.true;
	});

	it('should not let an author without delete-own-message delete their own message', async () => {
		expect(await canDeleteMessageAsync(author, messageOf(author))).to.be.false;
	});

	it("should let a user with delete-message delete another user's message, but not a user with only delete-own-message", async () => {
		grant(moderator, 'delete-message');
		grant(author, 'delete-own-message');

		expect(await canDeleteMessageAsync(moderator, messageOf(author))).to.be.true;
		expect(await canDeleteMessageAsync(author, messageOf(moderator))).to.be.false;
	});

	it('should not let a user who cannot access the room delete, even with force-delete-message', async () => {
		grant(moderator, 'force-delete-message');
		canAccessRoom.resolves(false);

		expect(await canDeleteMessageAsync(moderator, messageOf(author))).to.be.false;
	});

	it('should not let the author delete while message deleting is disabled, but still let a user with force-delete-message delete', async () => {
		setValue('Message_AllowDeleting', false);
		grant(author, 'delete-own-message');
		grant(moderator, 'force-delete-message');

		expect(await canDeleteMessageAsync(author, messageOf(author))).to.be.false;
		expect(await canDeleteMessageAsync(moderator, messageOf(author))).to.be.true;
	});

	it('should let the author delete a message only while it is younger than the deletion time limit', async () => {
		setValue('Message_AllowDeleting_BlockDeleteInMinutes', 10);
		grant(author, 'delete-own-message');

		expect(await canDeleteMessageAsync(author, messageOf(author, minutesAgo(5)))).to.be.true;
		expect(await canDeleteMessageAsync(author, messageOf(author, minutesAgo(15)))).to.be.false;
	});

	it('should let a user with bypass-time-limit-edit-and-delete delete a message older than the deletion time limit', async () => {
		setValue('Message_AllowDeleting_BlockDeleteInMinutes', 10);
		grant(author, 'delete-own-message');
		grant(author, 'bypass-time-limit-edit-and-delete');

		expect(await canDeleteMessageAsync(author, messageOf(author, minutesAgo(15)))).to.be.true;
	});
});
