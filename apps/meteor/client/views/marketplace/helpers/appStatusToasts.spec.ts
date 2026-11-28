import { AppStatus } from '@rocket.chat/apps-engine/definition/AppStatus';

import { warnAppInstall } from './warnAppInstall';
import { warnEnableDisableApp } from './warnEnableDisableApp';
import { warnStatusChange } from './warnStatusChange';
import { dispatchToastMessage } from '../../../lib/toast';

jest.mock('../../../lib/toast', () => ({ dispatchToastMessage: jest.fn() }));
jest.mock('../../../../lib/i18n', () => ({ t: (key: string) => `translated:${key}` }));

describe('app status toasts', () => {
	beforeEach(() => {
		jest.mocked(dispatchToastMessage).mockClear();
	});

	it('warnAppInstall should show the error status of the installed app', () => {
		warnAppInstall('Poll', AppStatus.ERROR_DISABLED);

		expect(dispatchToastMessage).toHaveBeenCalledWith({
			type: 'error',
			title: 'Poll',
			message: 'translated:App_status_error_disabled',
		});
	});

	it('warnEnableDisableApp should show the error status of the toggled app', () => {
		warnEnableDisableApp('Poll', AppStatus.COMPILER_ERROR_DISABLED, 'enable');

		expect(dispatchToastMessage).toHaveBeenCalledWith({
			type: 'error',
			title: 'Poll',
			message: 'translated:App_status_compiler_error_disabled',
		});
	});

	it('warnStatusChange should show the error status of the updated app', () => {
		warnStatusChange('Poll', AppStatus.ERROR_DISABLED);

		expect(dispatchToastMessage).toHaveBeenCalledWith({
			type: 'error',
			title: 'Poll',
			message: 'translated:App_status_error_disabled',
		});
	});

	it('warnStatusChange should show the new status of the updated app', () => {
		warnStatusChange('Poll', AppStatus.MANUALLY_ENABLED);

		expect(dispatchToastMessage).toHaveBeenCalledWith({
			type: 'info',
			title: 'Poll',
			message: 'translated:App_status_manually_enabled',
		});
	});
});
