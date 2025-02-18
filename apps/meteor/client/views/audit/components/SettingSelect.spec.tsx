import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render } from '@testing-library/react';

import { SettingSelect } from './SettingSelect';

describe('SecurityLogDisplay', () => {
	it.skip('should render', () => {
		const settingSelectProps = {
			value: 'option1',
			error: 'error',
			placeholder: 'placeholder',
			withTitle: true,
			onChange: (_value: string): void => undefined,
			options: [
				{ label: 'Option 1', value: 'option1' },
				{ label: 'Option 2', value: 'option2' },
			],
			Filter: 'filter',
			setFilter: (_value: string | number | undefined): void => undefined,
			settingPhase: 'settingPhase',
			loadMoreSettings: (_start: number, _end: number): void => undefined,
			settingsTotal: 0,
		};

		render(<SettingSelect {...settingSelectProps} />, { wrapper: mockAppRoot().withJohnDoe().build() });
	});
});
