import { composeStories } from '@storybook/react-webpack5';
import { getByRole, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import * as stories from './ToastBar.stories';
import ToastBarProvider from './ToastBarProvider';
import { render } from './testing';

const { Default, TopEnd } = composeStories(stories, {
	decorators: [
		(Story) => (
			<ToastBarProvider>
				<Story />
			</ToastBarProvider>
		),
	],
});

const topEndStyle = {
	top: '0',
	right: '0',
};

const topStartStyle = {
	top: '0',
	left: '0',
};

describe('[fuselage-toastbar rendering]', () => {
	test('should display ToastBar on the top right of the screen by default', async () => {
		render(<TopEnd />);
		const toast = screen.queryByRole('status');
		const toastContainer = toast?.parentElement?.parentElement?.parentElement;

		expect(toastContainer).toHaveStyle(topEndStyle);
	});

	test('should display ToastBar on the top right of the screen', async () => {
		document.body.setAttribute('dir', 'ltr');
		render(<TopEnd />);
		const toast = screen.queryByRole('status');
		const toastContainer = toast?.parentElement?.parentElement?.parentElement;

		expect(toastContainer).toHaveStyle(topEndStyle);
	});

	test('should display ToastBar on the top left of the screen', async () => {
		document.body.setAttribute('dir', 'rtl');
		render(<TopEnd />);
		const toast = screen.queryByRole('status');
		const toastContainer = toast?.parentElement?.parentElement?.parentElement;

		expect(toastContainer).toHaveStyle(topStartStyle);
	});
});

describe('[fuselage-toastbar interacting]', () => {
	test('should dispatch the ToastBar on click', async () => {
		const { container } = render(<Default />);
		const button = getByRole(container, 'button');

		await userEvent.click(button);
		const toasts = screen.queryAllByRole('alert');
		toasts.forEach((toast) => expect(toast).toBeInTheDocument());
	});
});
