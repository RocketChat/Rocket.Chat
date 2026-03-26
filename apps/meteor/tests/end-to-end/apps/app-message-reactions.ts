import { expect } from 'chai';
import { after, before, describe, it } from 'mocha';

import { getCredentials } from '../../data/api-data';
import { messageReactionTest } from '../../data/apps/app-packages';
import { cleanupApps, installLocalTestPackage } from '../../data/apps/helper';
import { sendSimpleMessage, getMessageById } from '../../data/chat.helper';
import { createRoom, deleteRoom } from '../../data/rooms.helper';
import { executeAppSlashCommand } from '../../data/slashcommands.helpers';
import { IS_EE } from '../../e2e/config/constants';

(IS_EE ? describe : describe.skip)('Apps - Message Reactions', () => {
	let roomId: string;

	before((done) => getCredentials(done));

	before(async () => {
		await cleanupApps();
		await installLocalTestPackage(messageReactionTest);

		const res = await createRoom({ type: 'c', name: `apps-reactions-test-${Date.now()}` });
		roomId = res.body.channel._id;
	});

	after(async () => {
		await deleteRoom({ type: 'c', roomId });
		await cleanupApps();
	});

	it('should add and remove a thumbs-up reaction to a message', async () => {
		const sendRes = await sendSimpleMessage({ roomId, text: 'reaction test message' });
		const messageId = sendRes.body.message._id;

		const slashRes = await executeAppSlashCommand('msg-update', roomId, `add ${messageId}`);
		expect(slashRes.status, 'Slash command to add reaction failed').to.equal(200);

		let message = await getMessageById({ msgId: messageId });
		expect(message.reactions, 'Message reactions should exist after adding').to.exist;
		expect(message.reactions, 'Message should have a thumbs-up reaction').to.have.property(':+1:');

		// Now remove the reaction
		const removeRes = await executeAppSlashCommand('msg-update', roomId, `remove ${messageId}`);
		expect(removeRes.status, 'Slash command to remove reaction failed').to.equal(200);

		message = await getMessageById({ msgId: messageId });
		const hasThumbsUp = Boolean(message.reactions && ':+1:' in message.reactions);
		expect(hasThumbsUp, 'Thumbs-up reaction should have been removed').to.be.false;
	});
});
