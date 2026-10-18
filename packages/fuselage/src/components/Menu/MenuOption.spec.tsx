import { axe } from 'jest-axe';

import MenuOption from './MenuOption';
import { render } from '../../testing';

describe('[MenuOption Component]', () => {
	it.each(['menuitem', 'menuitemcheckbox', 'menuitemradio'] as const)('should not set aria-selected on %s', (role) => {
		const { getByRole } = render(
			<ul role='menu'>
				<MenuOption role={role} {...(role !== 'menuitem' && { 'aria-checked': false })}>
					Option
				</MenuOption>
			</ul>,
		);

		expect(getByRole(role)).not.toHaveAttribute('aria-selected');
	});

	it('should still apply the selected class', () => {
		const { getByRole } = render(
			<ul role='menu'>
				<MenuOption role='menuitem' selected>
					Option
				</MenuOption>
			</ul>,
		);

		expect(getByRole('menuitem')).toHaveClass('rcx-option--selected');
	});

	it('should have no a11y violations', async () => {
		const { container } = render(
			<ul role='menu'>
				<MenuOption role='menuitemcheckbox' aria-checked>
					Option
				</MenuOption>
			</ul>,
		);

		expect(await axe(container)).toHaveNoViolations();
	});
});