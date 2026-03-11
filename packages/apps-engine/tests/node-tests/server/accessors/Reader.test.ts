import * as assert from 'node:assert';
import { describe, it } from 'node:test';

import type {
	ICloudWorkspaceRead,
	IEnvironmentRead,
	IExperimentalRead,
	ILivechatRead,
	IMessageRead,
	INotifier,
	IPersistenceRead,
	IRoleRead,
	IRoomRead,
	IUploadRead,
	IUserRead,
	IVideoConferenceRead,
} from '../../../../src/definition/accessors';
import type { IContactRead } from '../../../../src/definition/accessors/IContactRead';
import type { IOAuthAppsReader } from '../../../../src/definition/accessors/IOAuthAppsReader';
import type { IThreadRead } from '../../../../src/definition/accessors/IThreadRead';
import { Reader } from '../../../../src/server/accessors';

describe('Reader', () => {
	const env = {} as IEnvironmentRead;
	const msg = {} as IMessageRead;
	const pr = {} as IPersistenceRead;
	const rm = {} as IRoomRead;
	const ur = {} as IUserRead;
	const ni = {} as INotifier;
	const livechat = {} as ILivechatRead;
	const upload = {} as IUploadRead;
	const cloud = {} as ICloudWorkspaceRead;
	const videoConf = {} as IVideoConferenceRead;
	const oauthApps = {} as IOAuthAppsReader;
	const thread = {} as IThreadRead;
	const role = {} as IRoleRead;
	const contact = {} as IContactRead;
	const experimental = {} as IExperimentalRead;

	it('useReader', () => {
		assert.doesNotThrow(
			() =>
				new Reader(
					env,
					msg,
					pr,
					rm,
					ur,
					ni,
					livechat,
					upload,
					cloud,
					videoConf,
					contact,
					oauthApps,
					thread,
					role,
					experimental,
				),
		);

		const rd = new Reader(
			env,
			msg,
			pr,
			rm,
			ur,
			ni,
			livechat,
			upload,
			cloud,
			videoConf,
			contact,
			oauthApps,
			thread,
			role,
			experimental,
		);

		assert.ok(rd.getEnvironmentReader() !== undefined);
		assert.ok(rd.getMessageReader() !== undefined);
		assert.ok(rd.getNotifier() !== undefined);
		assert.ok(rd.getPersistenceReader() !== undefined);
		assert.ok(rd.getRoomReader() !== undefined);
		assert.ok(rd.getUserReader() !== undefined);
		assert.ok(rd.getLivechatReader() !== undefined);
		assert.ok(rd.getUploadReader() !== undefined);
		assert.ok(rd.getVideoConferenceReader() !== undefined);
		assert.ok(rd.getRoleReader() !== undefined);
	});
});
