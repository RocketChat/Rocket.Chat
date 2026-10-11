import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useToastBarDismiss, useToastBarDispatch } from './ToastBarContext';
import ToastBarProvider from './ToastBarProvider';

describe('ToastBarProvider', () => {
	test('does not rerender dispatch and dismiss consumers when toasts change', async () => {
		const onRender = jest.fn();

		const Consumer = () => {
			const dispatch = useToastBarDispatch();
			useToastBarDismiss();
			onRender();

			return (
				<button type='button' onClick={() => dispatch({ type: 'success', message: 'toast' })}>
					dispatch
				</button>
			);
		};

		render(
			<ToastBarProvider>
				<Consumer />
			</ToastBarProvider>,
		);

		await userEvent.click(screen.getByRole('button', { name: 'dispatch' }));
		expect(screen.getByRole('status')).toHaveTextContent('toast');

		await userEvent.click(screen.getByRole('button', { name: 'Dismiss alert' }));
		expect(screen.queryByRole('status')).not.toBeInTheDocument();

		expect(onRender).toHaveBeenCalledTimes(1);
	});
});
