import { faker } from '@faker-js/faker';
import { expect } from 'chai';
import { before, describe, it } from 'mocha';

import { getCredentials } from '../../../data/api-data';
import {
	sendMessage,
	startANewLivechatRoomAndTakeIt,
	sendAgentMessage,
	createAgent,
	makeAgentAvailable,
} from '../../../data/livechat/rooms';
import { updateSetting } from '../../../data/permissions.helper';

describe('LIVECHAT - messages', () => {
	before((done) => getCredentials(done));

	before(async () => {
		await createAgent();
		await makeAgentAvailable();
		await updateSetting('Livechat_Routing_Method', 'Manual_Selection');
	});

	describe('Quote message feature for visitors', () => {
		it('it should verify if visitor can quote message', async () => {
			const {
				room: { _id: roomId },
				visitor: { token },
			} = await startANewLivechatRoomAndTakeIt();

			await sendMessage(roomId, 'Hello from visitor', token);
			const agentMsgSentence = faker.lorem.sentence();
			const agentMsg = await sendAgentMessage(roomId, agentMsgSentence);

			const siteUrl = process.env.SITE_URL || process.env.TEST_API_URL || 'http://localhost:3000';

			const msgLink = `${siteUrl}/live/${roomId}?msg=${agentMsg._id}`;
			const quotedMsgSentence = faker.lorem.sentence();
			const wholeQuotedMsg = `[${msgLink}](${quotedMsgSentence})`;

			const quotedMessage = await sendMessage(roomId, wholeQuotedMsg, token);

			expect(quotedMessage).to.have.property('_id');
			expect(quotedMessage).to.have.property('msg').that.is.equal(wholeQuotedMsg);

			expect(quotedMessage).to.have.property('attachments');
			expect(quotedMessage.attachments).to.be.an('array').that.has.lengthOf(1);
			const quotedMessageAttachments = quotedMessage.attachments?.[0];
			if (quotedMessageAttachments) {
				expect(quotedMessageAttachments).to.have.property('message_link').that.is.equal(msgLink);
				expect(quotedMessageAttachments).to.have.property('text').that.is.equal(agentMsgSentence);
			}
		});
	});
});
