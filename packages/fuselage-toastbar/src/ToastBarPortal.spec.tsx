import { render } from '@testing-library/react';
import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';

import ToastBarPortal from './ToastBarPortal';

const getAnchor = () => document.getElementById('toastBarRoot');

afterEach(() => {
	getAnchor()?.remove();
});

describe('ToastBarPortal', () => {
	test('leaves the DOM untouched when rendered without committing', () => {
		expect(renderToString(<ToastBarPortal>toast</ToastBarPortal>)).toBe('');
		expect(getAnchor()).toBeNull();
	});

	test('renders children into an anchor on the body while mounted', () => {
		const { unmount } = render(<ToastBarPortal>toast</ToastBarPortal>);

		expect(getAnchor()?.parentElement).toBe(document.body);
		expect(getAnchor()).toHaveTextContent('toast');

		unmount();

		expect(getAnchor()).toBeNull();
	});

	test('keeps the anchor until the last portal unmounts', () => {
		const first = render(<ToastBarPortal>first</ToastBarPortal>);
		const second = render(<ToastBarPortal>second</ToastBarPortal>);

		expect(document.querySelectorAll('#toastBarRoot')).toHaveLength(1);

		first.unmount();
		expect(getAnchor()).toHaveTextContent('second');

		second.unmount();
		expect(getAnchor()).toBeNull();
	});

	test('survives StrictMode effect replays', () => {
		const { unmount } = render(
			<StrictMode>
				<ToastBarPortal>toast</ToastBarPortal>
			</StrictMode>,
		);

		expect(document.querySelectorAll('#toastBarRoot')).toHaveLength(1);
		expect(getAnchor()).toHaveTextContent('toast');

		unmount();

		expect(getAnchor()).toBeNull();
	});
});
