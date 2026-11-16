import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ToastBarContext } from './ToastBarContext';
import ToastBarTimed from './ToastBarTimed';

it('pauses the progress bar while the toast is hovered', async () => {
	render(
		<ToastBarContext.Provider value={{ dispatch: jest.fn(), dismiss: jest.fn() }}>
			<ToastBarTimed id='1' type='success' message='hello' time={5} />
		</ToastBarContext.Provider>,
	);
	// oxlint-disable-next-line testing-library/no-node-access -- the progress bar is decorative and exposes no role, label or text
	const bar = () => document.querySelector('.rcx-toastbar_progressbar');
	expect(bar()).not.toHaveClass('rcx-toastbar_progressbar--paused');

	await userEvent.hover(screen.getByRole('status'));
	expect(bar()).toHaveClass('rcx-toastbar_progressbar--paused');

	await userEvent.unhover(screen.getByRole('status'));
	expect(bar()).not.toHaveClass('rcx-toastbar_progressbar--paused');
});
