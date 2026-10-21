import { composeStories } from '@storybook/react-webpack5';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { RefObject } from 'react';

import * as stories from './Dropdown.stories';
import { DropdownDesktopWrapper } from './DropdownDesktopWrapper';
import { render } from '../../testing';

const { Default } = composeStories(stories);

describe('[Dropdown Component]', () => {
	const dropdownOption = screen.queryByText('Example 1');

	it('renders without crashing', () => {
		render(<Default />);
	});

	it('should show dropdown when anchor is clicked once', async () => {
		const { getByTestId } = render(<Default {...Default.args} />);
		const anchor = getByTestId('dropdown-anchor');
		await userEvent.click(anchor);
		expect(await screen.findByTestId('dropdown')).toBeInTheDocument();
	});

	it('should hide dropdown when anchor is clicked twice', async () => {
		const { getByTestId } = render(<Default {...Default.args} />);
		const anchor = getByTestId('dropdown-anchor');
		await userEvent.click(anchor);
		await userEvent.click(anchor);
		expect(dropdownOption).toBeNull();
	});

	describe('[DropdownDesktopWrapper]', () => {
		it('renders without crashing when ref is omitted', () => {
			const reference: RefObject<HTMLDivElement> = { current: document.createElement('div') };
			expect(() => {
				render(
					<DropdownDesktopWrapper reference={reference}>
						<div>Content</div>
					</DropdownDesktopWrapper>,
				);
			}).not.toThrow();
		});

		it('forwards the DOM node to a callback ref', () => {
			const reference: RefObject<HTMLDivElement> = { current: document.createElement('div') };
			let callbackNode: HTMLElement | null = null;
			render(
				<DropdownDesktopWrapper
					reference={reference}
					ref={(node) => {
						callbackNode = node;
					}}
				>
					<div>Content</div>
				</DropdownDesktopWrapper>,
			);
			expect(callbackNode).toBeInstanceOf(HTMLElement);
		});

		it('forwards the DOM node to an object ref', () => {
			const reference: RefObject<HTMLDivElement> = { current: document.createElement('div') };
			const targetRef: { current: HTMLElement | null } = { current: null };
			render(
				<DropdownDesktopWrapper reference={reference} ref={targetRef}>
					<div>Content</div>
				</DropdownDesktopWrapper>,
			);
			expect(targetRef.current).toBeInstanceOf(HTMLElement);
		});
	});
});
