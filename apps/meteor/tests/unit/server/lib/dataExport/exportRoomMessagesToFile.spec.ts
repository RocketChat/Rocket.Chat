import { faker } from '@faker-js/faker';
import { expect } from 'chai';
import { before, describe, it } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

import type { MessageData } from '../../../../../server/lib/dataExport/exportRoomMessagesToFile';
import { exportMessagesMock } from '../../../app/apps/server/mocks/data/messages.data';

// Create stubs for dependencies
const stubs = {
	findPaginatedMessages: sinon.stub(),
	mkdir: sinon.stub(),
	writeFile: sinon.stub(),
	findPaginatedMessagesCursor: sinon.stub(),
	findPaginatedMessagesTotal: sinon.stub(),
	translateKey: sinon.stub(),
	settings: sinon.stub(),
};

const { getMessageData, exportRoomMessages, exportMessageObject } = proxyquire
	.noCallThru()
	.load('../../../../../server/lib/dataExport/exportRoomMessagesToFile.ts', {
		'@rocket.chat/models': {
			Messages: {
				findPaginated: stubs.findPaginatedMessages,
			},
		},
		'fs/promises': {
			mkdir: stubs.mkdir,
			writeFile: stubs.writeFile,
		},
		'../i18n': {
			i18n: {
				t: stubs.translateKey,
			},
		},
		'../../../app/settings/server': {
			settings: stubs.settings,
		},
	});

describe('Export - exportMessageObject', () => {
	let messagesData: MessageData[];
	const translationPlaceholder = 'translation-placeholder';
	before(() => {
		stubs.translateKey.returns(translationPlaceholder);
		messagesData = exportMessagesMock.map((message) => getMessageData(message, false));
	});

	it('should only stringify message object when exporting message as json', async () => {
		const result = await exportMessageObject('json', messagesData[3]);

		expect(result).to.be.a.string;
		expect(result).to.equal(JSON.stringify(messagesData[3]));
	});

	it('should correctly add tags when exporting plain text message object as html', async () => {
		const result = await exportMessageObject('html', messagesData[3]);

		expect(result).to.be.a.string;
		expect(result).to.equal(
			`<p><strong>${messagesData[3].username}</strong> (${new Date(messagesData[3].ts).toUTCString()}):<br/>\n${messagesData[3].msg}\n</p>`,
		);
	});

	it('should correctly format system messages when exporting message object as html', async () => {
		const result = await exportMessageObject('html', messagesData[0]);

		expect(messagesData[0].msg).to.equal(translationPlaceholder);
		expect(result).to.be.a.string;
		expect(result).to.equal(
			`<p><strong>${messagesData[0].username}</strong> (${new Date(messagesData[0].ts).toUTCString()}):<br/>\n<i>${
				messagesData[0].msg
			}</i>\n</p>`,
		);
	});

	it('should correctly format non italic system messages when exporting message object as html', async () => {
		const result = await exportMessageObject('html', messagesData[4]);

		expect(messagesData[4].msg).to.equal(translationPlaceholder);
		expect(result).to.be.a.string;
		expect(result).to.equal(
			`<p><strong>${messagesData[4].username}</strong> (${new Date(messagesData[4].ts).toUTCString()}):<br/>\n${messagesData[4].msg}\n</p>`,
		);
	});

	it('should correctly reference file when exporting a message object with an attachment as html', async () => {
		const result = await exportMessageObject('html', messagesData[1], exportMessagesMock[1].file);

		expect(result).to.be.a.string;
		expect(result).to.equal(
			`<p><strong>${messagesData[1].username}</strong> (${new Date(messagesData[1].ts).toUTCString()}):<br/>\n${
				messagesData[1].msg
			}\n<br/><a href="./assets/${exportMessagesMock[1].file?._id}-${exportMessagesMock[1].file?.name}">${
				messagesData[1].attachments?.[0].title
			}</a>\n</p>`,
		);
	});

	it('should use fallback attachment description when no title is provided on message object export as html', async () => {
		const result = await exportMessageObject('html', messagesData[2], exportMessagesMock[2].file);

		expect(stubs.translateKey.calledWith('Message_Attachments')).to.be.true;
		expect(result).to.be.a.string;
		expect(result).to.equal(
			`<p><strong>${messagesData[2].username}</strong> (${new Date(messagesData[2].ts).toUTCString()}):<br/>\n${
				exportMessagesMock[1].msg
			}\n<br/><a href="./assets/${exportMessagesMock[2].file?._id}-${
				exportMessagesMock[2].file?.name
			}">${translationPlaceholder}</a>\n</p>`,
		);
	});
});

describe('Export - exportRoomMessages', () => {
	const totalMessages = 10;
	const userData = {
		_id: faker.database.mongodbObjectId(),
		name: faker.person.fullName(),
		username: faker.internet.userName(),
	};

	before(() => {
		stubs.findPaginatedMessagesCursor.resolves(exportMessagesMock);
		stubs.findPaginatedMessagesTotal.resolves(totalMessages);
		stubs.findPaginatedMessages.returns({
			cursor: { toArray: stubs.findPaginatedMessagesCursor },
			totalCount: stubs.findPaginatedMessagesTotal(),
		});
		stubs.translateKey.returns('translated-placeholder-uj');
	});

	it('should correctly export multiple messages to result when exporting room as json', async () => {
		const result = await exportRoomMessages('test-rid', 'json', 0, 100, userData);

		expect(stubs.translateKey.calledWith('User_joined_the_channel')).to.be.true;
		expect(result).to.be.an('object');
		expect(result).to.have.property('total', totalMessages);
		expect(result).to.have.property('exported', exportMessagesMock.length);
		expect(result).to.have.property('messages').that.is.an('array').of.length(exportMessagesMock.length);
		const messagesWithFiles = exportMessagesMock.filter((message) => message.file);
		expect(result).to.have.property('uploads').that.is.an('array').of.length(messagesWithFiles.length);
	});

	it('should correctly export multiple messages to result when exporting room as html', async () => {
		const result = await exportRoomMessages('test-rid', 'html', 0, 100, userData);

		expect(stubs.translateKey.calledWith('User_joined_the_channel')).to.be.true;
		expect(result).to.be.an('object');
		expect(result).to.have.property('total', totalMessages);
		expect(result).to.have.property('exported', exportMessagesMock.length);
		expect(result).to.have.property('messages').that.is.an('array').of.length(exportMessagesMock.length);
		const messagesWithFiles = exportMessagesMock.filter((message) => message.file);
		expect(result).to.have.property('uploads').that.is.an('array').of.length(messagesWithFiles.length);
	});
});
