import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const modelsMock = {
	Messages: {
		findOneById: sinon.stub(),
		insertOne: sinon.stub(),
		updateOne: sinon.stub(),
	},
	Rooms: {
		incMsgCountById: sinon.stub(),
	},
};

const parseUrlsInMessage = sinon.stub();
const validateMessage = sinon.stub();
const prepareMessageObject = sinon.stub();

const { insertMessage } = proxyquire.noCallThru().load('../../../../../server/lib/messages/insertMessage', {
	'@rocket.chat/models': { ...modelsMock, '@global': true },
	'./parseUrlsInMessage': { parseUrlsInMessage },
	'./sendMessage': { validateMessage, prepareMessageObject },
});

describe('insertMessage', () => {
	const user = { _id: 'rocket.cat', username: 'rocket.cat' };

	beforeEach(() => {
		modelsMock.Messages.findOneById.reset();
		modelsMock.Messages.insertOne.reset();
		modelsMock.Messages.updateOne.reset();
		modelsMock.Rooms.incMsgCountById.reset();
		parseUrlsInMessage.reset();
		validateMessage.reset();
		prepareMessageObject.reset();

		parseUrlsInMessage.returns([]);
		modelsMock.Messages.insertOne.resolves({ insertedId: 'messageId' });
	});

	// Imported messages are assembled out of optional attributes, and the mongo connection is configured with
	// `ignoreUndefined: false` - so every attribute the message doesn't have would be stored as `null`
	it('should ignore undefined attributes when inserting a new message', async () => {
		await insertMessage(user, { msg: 'test', u: user, t: undefined }, 'roomId');

		expect(modelsMock.Messages.insertOne.getCall(0).args[1]).to.be.deep.equal({ ignoreUndefined: true });
	});

	it('should ignore undefined attributes when inserting a message with a preset id', async () => {
		modelsMock.Messages.findOneById.resolves(undefined);

		await insertMessage(user, { _id: 'messageId', msg: 'test', u: user, t: undefined }, 'roomId', true);

		expect(modelsMock.Messages.insertOne.getCall(0).args[1]).to.be.deep.equal({ ignoreUndefined: true });
	});

	it('should ignore undefined attributes when updating an existing message', async () => {
		modelsMock.Messages.findOneById.resolves({ _id: 'messageId' });

		await insertMessage(user, { _id: 'messageId', msg: 'test', u: user, t: undefined }, 'roomId', true);

		expect(modelsMock.Messages.updateOne.getCall(0).args[2]).to.be.deep.equal({ ignoreUndefined: true });
	});
});
