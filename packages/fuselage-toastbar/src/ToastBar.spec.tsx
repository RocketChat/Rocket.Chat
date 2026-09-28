import { composeStories } from '@storybook/react-webpack5';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import * as stories from './ToastBar.stories';
import ToastBarProvider from './ToastBarProvider';

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
		const zone = screen.getByTestId('toastbar-zone-top-end');

		expect(within(zone).getByRole('status')).toBeInTheDocument();
		expect(zone).toHaveStyle(topEndStyle);
	});

	test('should display ToastBar on the top right of the screen', async () => {
		document.body.setAttribute('dir', 'ltr');
		render(<TopEnd />);
		const zone = screen.getByTestId('toastbar-zone-top-end');

		expect(within(zone).getByRole('status')).toBeInTheDocument();
		expect(zone).toHaveStyle(topEndStyle);
	});

	test('should display ToastBar on the top left of the screen', async () => {
		document.body.setAttribute('dir', 'rtl');
		render(<TopEnd />);
		const zone = screen.getByTestId('toastbar-zone-top-end');

		expect(within(zone).getByRole('status')).toBeInTheDocument();
		expect(zone).toHaveStyle(topStartStyle);
	});
});

describe('[fuselage-toastbar interacting]', () => {
	test('should dispatch the ToastBar on click', async () => {
		render(<Default />);

		await userEvent.click(screen.getByRole('button', { name: 'Dispatch ToastBar' }));

		expect(within(screen.getByTestId('toastbar-zone-top-end')).getByRole('status')).toBeInTheDocument();
		expect(within(screen.getByTestId('toastbar-zone-bottom-start')).getByRole('alert')).toBeInTheDocument();
	});
});
