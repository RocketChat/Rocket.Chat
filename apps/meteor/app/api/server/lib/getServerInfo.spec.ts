import { expect } from 'chai';
import { describe, it, beforeEach, vi } from 'vitest';

const { hasAllPermissionAsyncMock, getCachedSupportedVersionsTokenMock } = vi.hoisted(() => {
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const sinon = require('sinon');
	return { hasAllPermissionAsyncMock: sinon.stub(), getCachedSupportedVersionsTokenMock: sinon.stub() };
});

vi.mock('../../../utils/rocketchat.info', () => ({ Info: { version: '3.0.1' } }));
vi.mock('../../../authorization/server/functions/hasPermission', () => ({ hasPermissionAsync: hasAllPermissionAsyncMock }));
vi.mock('../../../cloud/server/functions/supportedVersionsToken/supportedVersionsToken', () => ({
	getCachedSupportedVersionsToken: getCachedSupportedVersionsTokenMock,
}));
vi.mock('../../../settings/server', () => ({ settings: new Map() }));

const { getServerInfo } = await import('./getServerInfo');

// #ToDo: Fix those tests in a separate PR
describe.skip('#getServerInfo()', () => {
	beforeEach(() => {
		hasAllPermissionAsyncMock.reset();
		getCachedSupportedVersionsTokenMock.reset();
	});

	it('should return only the version (without the patch info) when the user is not present', async () => {
		expect(await getServerInfo(undefined)).to.be.eql({ version: '3.0' });
	});

	it('should return only the version (without the patch info) when the user present but they dont have permission', async () => {
		hasAllPermissionAsyncMock.resolves(false);
		expect(await getServerInfo('userId')).to.be.eql({ version: '3.0' });
	});

	it('should return the info object + the supportedVersions from the cloud when the request to the cloud was a success', async () => {
		const signedJwt = 'signedJwt';
		hasAllPermissionAsyncMock.resolves(true);
		getCachedSupportedVersionsTokenMock.resolves(signedJwt);
		expect(await getServerInfo('userId')).to.be.eql({ info: { version: '3.0.1', supportedVersions: signedJwt } });
	});

	it('should return the info object ONLY from the cloud when the request to the cloud was NOT a success', async () => {
		hasAllPermissionAsyncMock.resolves(true);
		getCachedSupportedVersionsTokenMock.rejects();
		expect(await getServerInfo('userId')).to.be.eql({ info: { version: '3.0.1' } });
	});
});
