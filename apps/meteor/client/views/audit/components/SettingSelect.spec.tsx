import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render } from '@testing-library/react';

import { SettingSelect } from './SettingSelect';

describe('SecurityLogDisplay', () => {
	it('should render', () => {
		const props = {
			value: 'option1',
			placeholder: 'placeholder',
			withTitle: true,
			onChange: (value: string): void => undefined,
			options: [
				{ label: 'Option 1', value: 'option1' },
				{ label: 'Option 2', value: 'option2' },
			],
			Filter: 'filter',
			setFilter: (value: string | number | undefined): void => undefined,
			settingPhase: 'settingPhase',
			loadMoreSettings: (start: number, end: number): void => undefined,
			settingsTotal: 10,
		};

		render(<SettingSelect {...props} />, { wrapper: mockAppRoot().withJohnDoe().build() });
	});

	it('should display the correct data', () => {
		const props = {
			value: 'option1',
			error: 'error',
			placeholder: 'placeholder',
			withTitle: true,
			onChange: (value: string): void => undefined,
			options: [
				{ label: 'Option 1', value: 'option1' },
				{ label: 'Option 2', value: 'option2' },
			],
			Filter: 'filter',
			setFilter: (value: string | number | undefined): void => undefined,
			settingPhase: 'settingPhase',
			loadMoreSettings: (start: number, end: number): void => undefined,
			settingsTotal:
		render(<SettingSelect {...props} />, { wrapper: mockAppRoot().withJohnDoe().build() });
	});
});
