import { render, screen } from '@testing-library/react';
import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';

import ToastBarPortal from './ToastBarPortal';

// eslint-disable-next-line testing-library/no-node-access -- the anchor element's lifecycle is what these tests cover
const queryAnchors = () => document.querySelectorAll('#toastBarRoot');

describe('ToastBarPortal', () => {
	test('leaves the DOM untouched when rendered without committing', () => {
		expect(renderToString(<ToastBarPortal>toast</ToastBarPortal>)).toBe('');
		expect(queryAnchors()).toHaveLength(0);
	});

	test('renders children into an anchor on the body while mounted', () => {
		const { unmount } = render(<ToastBarPortal>toast</ToastBarPortal>);

		expect(document.body).toContainElement(screen.getByText('toast'));
		expect(queryAnchors()).toHaveLength(1);

		unmount();

		expect(screen.queryByText('toast')).not.toBeInTheDocument();
		expect(queryAnchors()).toHaveLength(0);
	});

	test('keeps the anchor until the last portal unmounts', () => {
		const { unmount: unmountFirst } = render(<ToastBarPortal>first</ToastBarPortal>);
		const { unmount: unmountSecond } = render(<ToastBarPortal>second</ToastBarPortal>);

		expect(queryAnchors()).toHaveLength(1);

		unmountFirst();

		expect(screen.queryByText('first')).not.toBeInTheDocument();
		expect(screen.getByText('second')).toBeInTheDocument();
		expect(queryAnchors()).toHaveLength(1);

		unmountSecond();

		expect(queryAnchors()).toHaveLength(0);
	});

	test('survives StrictMode effect replays', () => {
		const { unmount } = render(
			<StrictMode>
				<ToastBarPortal>toast</ToastBarPortal>
			</StrictMode>,
		);

		expect(screen.getByText('toast')).toBeInTheDocument();
		expect(queryAnchors()).toHaveLength(1);

		unmount();

		expect(queryAnchors()).toHaveLength(0);
	});
});
