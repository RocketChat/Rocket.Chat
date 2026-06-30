import { expect } from 'chai';
import { beforeAll, describe, it, vi } from 'vitest';

// Stubs are built in `vi.hoisted` so the hoisted `vi.mock` factories can reference them.
// `sinon.match` matchers are instance-specific, so we use the matcher from the SAME sinon
// instance that created the stubs (the hoisted one) when asserting `calledWith(sinon.match(...))`.
const { stubs, sinon } = vi.hoisted(() => {
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const sinon = require('sinon');
	return {
		sinon,
		stubs: {
			findOneUserById: sinon.stub(),
			randomId: sinon.stub(),
			stat: sinon.stub(),
			getStore: sinon.stub(),
			insertFileStub: sinon.stub(),
			createReadStream: sinon.stub(),
		},
	};
});

vi.mock('@rocket.chat/models', () => ({
	Users: {
		findOneById: stubs.findOneUserById,
	},
}));
vi.mock('@rocket.chat/random', () => ({
	Random: {
		id: stubs.randomId,
	},
}));
vi.mock('node:fs/promises', () => ({
	stat: stubs.stat,
}));
vi.mock('node:fs', () => ({
	createReadStream: stubs.createReadStream,
}));
vi.mock('../../../../../app/file-upload/server', () => ({
	FileUpload: {
		getStore: stubs.getStore,
	},
}));

const { uploadZipFile } = await import('../../../../../server/lib/dataExport/uploadZipFile');

describe('Export - uploadZipFile', () => {
	const randomId = 'random-id';
	const fileStat = 100;
	const userName = 'John Doe';
	const userUsername = 'john.doe';
	const userId = 'user-id';
	const filePath = 'random-path';

	beforeAll(() => {
		stubs.findOneUserById.returns({ name: userName });
		stubs.stat.returns({ size: fileStat });
		stubs.randomId.returns(randomId);
		stubs.getStore.returns({ insert: stubs.insertFileStub });
		stubs.insertFileStub.callsFake((details) => ({ _id: details._id, name: details.name }));
	});

	it('should correctly build file name for json exports', async () => {
		const result = await uploadZipFile(filePath, userId, 'json');

		expect(stubs.findOneUserById.calledWith(userId)).to.be.true;
		expect(stubs.stat.calledWith(filePath)).to.be.true;
		expect(stubs.createReadStream.calledWith(filePath)).to.be.true;
		expect(stubs.getStore.calledWith('UserDataFiles')).to.be.true;
		expect(
			stubs.insertFileStub.calledWith(
				sinon.match({
					_id: randomId,
					userId,
					type: 'application/zip',
					size: fileStat,
				}),
			),
		).to.be.true;

		expect(result).to.have.property('_id', randomId);
		expect(result).to.have.property('name').that.is.a.string;
		const fileName: string = result.name;
		expect(fileName.endsWith(encodeURIComponent(`${userName}-data-${randomId}.zip`))).to.be.true;
	});

	it('should correctly build file name for html exports', async () => {
		const result = await uploadZipFile(filePath, userId, 'html');

		expect(stubs.findOneUserById.calledWith(userId)).to.be.true;
		expect(stubs.stat.calledWith(filePath)).to.be.true;
		expect(stubs.createReadStream.calledWith(filePath)).to.be.true;
		expect(stubs.getStore.calledWith('UserDataFiles')).to.be.true;
		expect(
			stubs.insertFileStub.calledWith(
				sinon.match({
					_id: randomId,
					userId,
					type: 'application/zip',
					size: fileStat,
				}),
			),
		).to.be.true;

		expect(result).to.have.property('_id', randomId);
		expect(result).to.have.property('name').that.is.a.string;
		const fileName: string = result.name;
		expect(fileName.endsWith(encodeURIComponent(`${userName}-${randomId}.zip`))).to.be.true;
	});

	it("should use username as a fallback in the zip file name when user's name is not defined", async () => {
		stubs.findOneUserById.returns({ username: userUsername });
		const result = await uploadZipFile(filePath, userId, 'html');

		expect(stubs.findOneUserById.calledWith(userId)).to.be.true;
		expect(stubs.stat.calledWith(filePath)).to.be.true;
		expect(stubs.createReadStream.calledWith(filePath)).to.be.true;
		expect(stubs.getStore.calledWith('UserDataFiles')).to.be.true;
		expect(
			stubs.insertFileStub.calledWith(
				sinon.match({
					_id: randomId,
					userId,
					type: 'application/zip',
					size: fileStat,
				}),
			),
		).to.be.true;

		expect(result).to.have.property('_id', randomId);
		expect(result).to.have.property('name').that.is.a.string;
		const fileName: string = result.name;
		expect(fileName.endsWith(`${userUsername}-${randomId}.zip`)).to.be.true;
	});

	it("should use userId as a fallback in the zip file name when user's name and username are not defined", async () => {
		stubs.findOneUserById.returns(undefined);
		const result = await uploadZipFile(filePath, userId, 'html');

		expect(stubs.findOneUserById.calledWith(userId)).to.be.true;
		expect(stubs.stat.calledWith(filePath)).to.be.true;
		expect(stubs.createReadStream.calledWith(filePath)).to.be.true;
		expect(stubs.getStore.calledWith('UserDataFiles')).to.be.true;
		expect(
			stubs.insertFileStub.calledWith(
				sinon.match({
					_id: randomId,
					userId,
					type: 'application/zip',
					size: fileStat,
				}),
			),
		).to.be.true;

		expect(result).to.have.property('_id', randomId);
		expect(result).to.have.property('name').that.is.a.string;
		const fileName: string = result.name;
		expect(fileName.endsWith(`${userId}-${randomId}.zip`)).to.be.true;
	});
});
