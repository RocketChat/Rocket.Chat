import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import EnabledAppsCount from './EnabledAppsCount';

describe('in private context', () => {
	const context = 'private';

	it('should work under the limit', async () => {
		render(<EnabledAppsCount enabled={1} limit={2} context={context} />, {
			wrapper: mockAppRoot()
				.withTranslations('en', 'core', {
					Private_Apps_Count_Enabled_one: '{{count}} private app enabled',
					Private_Apps_Count_Enabled_other: '{{count}} private apps enabled',
				})
				.build(),
		});

		expect(screen.getByText('1 private app enabled')).toBeInTheDocument();
		expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuemin', '0');
		expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50');
		expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '100');
	});

	it('should work with private apps disabled', async () => {
		render(<EnabledAppsCount enabled={0} limit={0} context={context} />, {
			wrapper: mockAppRoot()
				.withTranslations('en', 'core', {
					Private_Apps_Count_Enabled_one: '{{count}} private app enabled',
					Private_Apps_Count_Enabled_other: '{{count}} private apps enabled',
				})
				.build(),
		});

		expect(screen.getByText('0 private apps enabled')).toBeInTheDocument();
		expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuemin', '0');
		expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
		expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '100');
	});
});

describe.each(['explore', 'installed', 'premium', 'requested'] as const)('in %s context', (context) => {
	it('should work', async () => {
		render(<EnabledAppsCount enabled={1} limit={2} context={context} />, {
			wrapper: mockAppRoot()
				.withTranslations('en', 'core', {
					Apps_Count_Enabled_one: '{{count}} app enabled',
					Apps_Count_Enabled_other: '{{count}} apps enabled',
				})
				.build(),
		});

		expect(screen.getByText('1 app enabled')).toBeInTheDocument();
		expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuemin', '0');
		expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50');
		expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '100');
	});
});
