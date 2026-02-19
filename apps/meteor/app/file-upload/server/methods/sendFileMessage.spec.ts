import { expect } from 'chai';
import { describe, it } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const { parseFileIntoMessageAttachments } = proxyquire.noCallThru().load('./sendFileMessage', {
	'@rocket.chat/models': {
		Rooms: sinon.stub(),
		Uploads: {
			updateFileComplete: sinon.stub().resolves(),
		},
		Users: sinon.stub(),
	},
	'@rocket.chat/ddp-client': {
		'@noCallThru': true,
	},
	'meteor/check': {
		Match: {
			Maybe: sinon.stub(),
			Optional: sinon.stub(),
			ObjectIncluding: sinon.stub(),
		},
		check: sinon.stub(),
	},
	'meteor/meteor': {
		Meteor: {
			Error: sinon.stub().callsFake((error: string, reason: string, details?: any) => {
				const err = new Error(reason);
				(err as any).error = error;
				(err as any).details = details;
				return err;
			}),
		},
	},
	'../../../../lib/utils/getFileExtension': {
		getFileExtension: sinon.stub().callsFake((filename: string) => {
			const parts = filename.split('.');
			return parts.length > 1 ? parts[parts.length - 1] : '';
		}),
	},
	'../../../../lib/utils/omit': {
		omit: sinon.stub().callsFake((obj) => obj),
	},
	'../../../../server/lib/callbacks': { callbacks: sinon.stub() },
	'../../../../server/lib/logger/system': { SystemLogger: { error: sinon.stub() } },
	'../../../authorization/server/functions/canAccessRoom': {
		canAccessRoomAsync: sinon.stub(),
	},
	'../../../lib/server/methods/sendMessage': {
		executeSendMessage: sinon.stub(),
	},
	'../lib/FileUpload': {
		FileUpload: {
			getPath: sinon.stub().returns('/file/path'),
			resizeImagePreview: sinon.stub().resolves('base64preview'),
			createImageThumbnail: sinon.stub().resolves(null),
		},
	},
});

describe('sendFileMessage - parseFileIntoMessageAttachments', () => {
	it('should not attempt preview generation for .dwg files with image/vnd.dwg MIME type', async () => {
		const file = {
			_id: 'file-id',
			name: 'test.dwg',
			type: 'image/vnd.dwg',
			size: 1024,
		};

		const result = await parseFileIntoMessageAttachments(file, 'room-id', { _id: 'user-id' } as any);

		expect(result.attachments).to.have.lengthOf(1);
		expect(result.attachments[0]).to.not.have.property('image_url');
		expect(result.attachments[0]).to.have.property('title_link');
		expect(result.attachments[0]).to.have.property('format', 'dwg');
	});

	it('should generate preview for supported image formats like PNG', async () => {
		const file = {
			_id: 'file-id',
			name: 'test.png',
			type: 'image/png',
			size: 1024,
		};

		const result = await parseFileIntoMessageAttachments(file, 'room-id', { _id: 'user-id' } as any);

		expect(result.attachments).to.have.lengthOf(1);
		expect(result.attachments[0]).to.have.property('image_url');
		expect(result.attachments[0]).to.have.property('image_type', 'image/png');
	});

	it('should generate preview for JPEG files', async () => {
		const file = {
			_id: 'file-id',
			name: 'test.jpg',
			type: 'image/jpeg',
			size: 1024,
		};

		const result = await parseFileIntoMessageAttachments(file, 'room-id', { _id: 'user-id' } as any);

		expect(result.attachments).to.have.lengthOf(1);
		expect(result.attachments[0]).to.have.property('image_url');
		expect(result.attachments[0]).to.have.property('image_type', 'image/jpeg');
	});

	it('should not attempt preview generation for other vendor image types like image/vnd.microsoft.icon', async () => {
		const file = {
			_id: 'file-id',
			name: 'test.ico',
			type: 'image/vnd.microsoft.icon',
			size: 1024,
		};

		const result = await parseFileIntoMessageAttachments(file, 'room-id', { _id: 'user-id' } as any);

		expect(result.attachments).to.have.lengthOf(1);
		expect(result.attachments[0]).to.not.have.property('image_url');
		expect(result.attachments[0]).to.have.property('title_link');
	});
});
