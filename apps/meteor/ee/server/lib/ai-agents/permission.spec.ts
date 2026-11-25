import type { LicenseManager } from '@rocket.chat/license';
import { mockModel } from '@rocket.chat/models/testing';

import { createManageAiAgentsPermissionWhenLicensed } from './permission';

const create = jest.fn();

// behaves as LicenseManager.onLicense: runs the callback now if the module is licensed, else when it becomes licensed
const fakeLicense = (licensed: string[]) => {
	const waiting = new Map<string, () => unknown>();
	const license = {
		onLicense: (module: string, cb: () => unknown) => {
			if (licensed.includes(module)) {
				return cb() as Promise<void>;
			}
			waiting.set(module, cb);
		},
	} as unknown as LicenseManager;
	const grant = async (module: string) => waiting.get(module)?.();
	return { license, grant };
};

describe('createManageAiAgentsPermissionWhenLicensed', () => {
	beforeAll(() => {
		mockModel('Permissions', { create });
	});

	beforeEach(() => {
		create.mockReset().mockResolvedValue(undefined);
	});

	it('does not create the permission on a workspace without the AI add-on', async () => {
		await createManageAiAgentsPermissionWhenLicensed(fakeLicense([]).license);

		expect(create).not.toHaveBeenCalled();
	});

	it('does not create the permission when only other modules are licensed', async () => {
		await createManageAiAgentsPermissionWhenLicensed(fakeLicense(['livechat-enterprise', 'auditing']).license);

		expect(create).not.toHaveBeenCalled();
	});

	it('creates the permission for admins when the AI add-on is licensed', async () => {
		await createManageAiAgentsPermissionWhenLicensed(fakeLicense(['chat.rocket.rc-ai']).license);

		expect(create).toHaveBeenCalledTimes(1);
		expect(create).toHaveBeenCalledWith('manage-ai-agents', ['admin']);
	});

	it('creates the permission only once the AI add-on becomes licensed', async () => {
		const { license, grant } = fakeLicense([]);
		await createManageAiAgentsPermissionWhenLicensed(license);
		expect(create).not.toHaveBeenCalled();

		await grant('chat.rocket.rc-ai');

		expect(create).toHaveBeenCalledWith('manage-ai-agents', ['admin']);
	});
});
