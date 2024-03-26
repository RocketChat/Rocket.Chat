import { expect } from 'chai';
import { before, describe, it } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

// Create stubs for dependencies
const stubs = {
	mkdir: sinon.stub(),
	writeFile: sinon.stub(),
	translateKey: sinon.stub(),
	settings: sinon.stub(),
};

const { exportMessageObject } = proxyquire.noCallThru().load('../../../../../server/lib/dataExport/exportRoomMessagesToFile.ts', {
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

const messages = [
	{
		_id: '65f46ce9e162d4ca5e6aba5c',
		t: 'uj',
		rid: 'GENERAL',
		ts: new Date('2024-03-15T15:44:41.889Z'),
		msg: 'matheus.barbosa',
		u: {
			_id: 'oNfuDGerMEiPoF7tq',
			username: 'matheus.barbosa',
			name: 'Matheus Barbosa Silva',
		},
		groupable: false,
	},
	{
		_id: 'LmHvpSLmZfwcuNG9e',
		rid: '65f7aa32d187cb7fe6779da3',
		ts: new Date('2024-03-20T13:46:01.623Z'),
		file: {
			_id: 'txt-file-id',
			name: 'test.txt',
			type: 'text/plain',
			size: 29,
			format: '',
		},
		msg: '',
		groupable: false,
		u: {
			_id: 'oNfuDGerMEiPoF7tq',
			username: 'matheus.barbosa',
			name: 'Matheus Barbosa Silva',
		},
		_updatedAt: new Date('2024-03-20T13:46:01.667Z'),
	},
	{
		_id: '8AhSDvDNGMqDc3zwa',
		rid: 'GENERAL',
		msg: 'hello msg here',
		ts: new Date('2024-03-26T18:24:21.994Z'),
		u: {
			_id: 'oNfuDGerMEiPoF7tq',
			username: 'matheus.barbosa',
			name: 'Matheus Barbosa Silva',
		},
	},
];
const messagesData = [
	{ msg: 'joined the channel', username: 'matheus.barbosa', ts: '2024-03-15T15:44:41.889Z', type: 'uj' },
	{
		msg: '',
		username: 'matheus.barbosa',
		ts: '2024-03-20T13:46:01.623Z',
		attachments: [
			{
				type: 'file',
				title: 'test.txt',
				title_link: '/file-upload/txt-file-id/test.txt',
				url: '/file-upload/id/test.txt',
				remote: false,
				fileId: 'txt-file-id',
				fileName: 'test.txt',
			},
		],
	},
	{
		msg: '',
		username: 'matheus.barbosa',
		ts: '2024-03-20T13:46:01.623Z',
		attachments: [
			{
				type: 'file',
				title: undefined,
				title_link: '/file-upload/txt-file-id/test.txt',
				url: '/file-upload/id/test.txt',
				remote: false,
				fileId: 'txt-file-id',
				fileName: 'test.txt',
			},
		],
	},
	{ msg: 'hello msg here', username: 'matheus.barbosa', ts: '2024-03-26T18:24:21.994Z' },
];

describe('Export - exportMessageObject', () => {
	before(() => {
		stubs.translateKey.returns('translated-placeholder-attachment');
	});

	it('should only stringify message object when exporting message as json', async () => {
		const result = await exportMessageObject('json', messagesData[3]);

		expect(result).to.be.a.string;
		expect(result).to.equal(`{"msg":"${messagesData[3].msg}","username":"${messagesData[3].username}","ts":"2024-03-26T18:24:21.994Z"}`);
	});

	it('should correctly add tags when exporting plain text message object as html', async () => {
		const result = await exportMessageObject('html', messagesData[3]);

		expect(result).to.be.a.string;
		expect(result).to.equal(
			`<p><strong>${messagesData[3].username}</strong> (Tue, 26 Mar 2024 18:24:21 GMT):<br/>\n${messagesData[3].msg}\n</p>`,
		);
	});

	it('should correctly format system messages when exporting message object as html', async () => {
		const result = await exportMessageObject('html', messagesData[0]);

		expect(result).to.be.a.string;
		expect(result).to.equal(
			`<p><strong>${messagesData[0].username}</strong> (Fri, 15 Mar 2024 15:44:41 GMT):<br/>\n<i>joined the channel</i>\n</p>`,
		);
	});

	it('should correctly reference file when exporting a message object with an attachment as html', async () => {
		const result = await exportMessageObject('html', messagesData[1], messages[1].file);

		expect(result).to.be.a.string;
		expect(result).to.equal(
			`<p><strong>${messagesData[1].username}</strong> (Wed, 20 Mar 2024 13:46:01 GMT):<br/>\n${messagesData[1].msg}\n<br/><a href="./assets/${messages[1].file?._id}-${messages[1].file?.name}">${messagesData[1].attachments?.[0].title}</a>\n</p>`,
		);
	});

	it('should use fallback attachment description when no title is provided on message object export as html', async () => {
		const result = await exportMessageObject('html', messagesData[2], messages[1].file);

		expect(stubs.translateKey.calledWith('Message_Attachments')).to.be.true;
		expect(result).to.be.a.string;
		expect(result).to.equal(
			`<p><strong>${messagesData[2].username}</strong> (Wed, 20 Mar 2024 13:46:01 GMT):<br/>\n${messages[1].msg}\n<br/><a href="./assets/${messages[1].file?._id}-${messages[1].file?.name}">translated-placeholder-attachment</a>\n</p>`,
		);
	});
});
