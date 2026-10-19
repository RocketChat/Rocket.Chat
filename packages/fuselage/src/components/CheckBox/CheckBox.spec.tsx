import { composeStories } from '@storybook/react-webpack5';
import { fireEvent, screen } from '@testing-library/react';
import { axe } from 'jest-axe';

import * as stories from './CheckBox.stories';
import { render } from '../../testing';

const { Default, Indeterminate, Disabled, DefaultChecked } = composeStories(stories);

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

describe('[CheckBox Rendering]', () => {
	test.each(testCases)(`renders %s without crashing`, async (_storyname, Story) => {
		const tree = render(<Story />);
		expect(tree.baseElement).toMatchSnapshot();
	});

	test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
		const { container } = render(<Story />);

		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});
});

describe('[CheckBox Interacting]', () => {
	it('changes style of element as checkbox is checked', () => {
		render(<Default />);
		const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
		fireEvent.click(checkbox);
		expect(checkbox.checked).toEqual(true);
	});
	it('changes style of element as checkbox is checked/unchecked', () => {
		render(<Default />);
		const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
		fireEvent.click(checkbox);
		fireEvent.click(checkbox);
		expect(checkbox.checked).toEqual(false);
	});
	it('displays checkbox indeterminate correctly', () => {
		render(<Indeterminate />);
		const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
		expect(checkbox.indeterminate).toEqual(true);
	});

	it('displays checkbox with defaultChecked value correctly', () => {
		render(<DefaultChecked />);
		const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
		expect(checkbox.defaultChecked).toEqual(true);
	});

	it('displays checkbox disabled correctly', () => {
		render(<Disabled />);
		const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
		expect(checkbox.disabled).toEqual(true);
	});
});
