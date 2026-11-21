import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useFullscreen } from './useFullscreen';
import FullscreenButton from '../components/FullscreenButton';

const dispatchToastMessage = jest.fn();
const requestFullscreen = jest.fn();
const exitFullscreen = jest.fn();
let fullscreenElement: Element | null = null;

// Something to show fullscreen, with the button that does it inside, as it would be over a shared screen.
const Shown = () => {
	const [ref, { available, fullscreen, toggle }] = useFullscreen();

	return <section ref={ref}>{available && <FullscreenButton fullscreen={fullscreen} onToggle={toggle} />}</section>;
};

const renderShown = () =>
	render(<Shown />, {
		wrapper: mockAppRoot()
			.withTranslations('en', 'core', {
				Fullscreen: 'Fullscreen',
				Exit_fullscreen: 'Exit fullscreen',
				Fullscreen_failed_to_switch_not_allowed: 'Switching to fullscreen was not allowed',
			})
			.withToastMessageDispatch(dispatchToastMessage)
			.build(),
	});

beforeEach(() => {
	jest.clearAllMocks();
	fullscreenElement = null;
	requestFullscreen.mockResolvedValue(undefined);
	exitFullscreen.mockResolvedValue(undefined);

	Object.defineProperty(HTMLElement.prototype, 'requestFullscreen', { value: requestFullscreen, configurable: true });
	Object.defineProperty(document, 'exitFullscreen', { value: exitFullscreen, configurable: true });
	Object.defineProperty(document, 'fullscreenEnabled', { value: true, configurable: true });
	Object.defineProperty(document, 'fullscreenElement', { get: () => fullscreenElement, configurable: true });
});

it('shows the element its ref is on fullscreen, and back', async () => {
	const user = userEvent.setup();
	renderShown();

	await user.click(screen.getByRole('button', { name: 'Fullscreen' }));

	expect(requestFullscreen).toHaveBeenCalledTimes(1);
	const [target] = requestFullscreen.mock.contexts;
	expect(target).toContainElement(screen.getByRole('button', { name: 'Fullscreen' }));

	act(() => {
		fullscreenElement = target;
		document.dispatchEvent(new Event('fullscreenchange'));
	});

	const toggle = screen.getByRole('button', { name: 'Fullscreen' });
	expect(toggle).toHaveAttribute('aria-pressed', 'true');
	expect(toggle).toHaveAttribute('title', 'Exit fullscreen');

	await user.click(toggle);
	expect(exitFullscreen).toHaveBeenCalledTimes(1);
});

// Another element going fullscreen is not this one.
it('is not fullscreen while something else is', () => {
	renderShown();

	act(() => {
		fullscreenElement = document.body;
		document.dispatchEvent(new Event('fullscreenchange'));
	});

	expect(screen.getByRole('button', { name: 'Fullscreen' })).toHaveAttribute('aria-pressed', 'false');
});

it('says so when the browser refuses to go fullscreen', async () => {
	const user = userEvent.setup();
	requestFullscreen.mockRejectedValueOnce(new TypeError('Permissions check failed'));
	renderShown();

	await user.click(screen.getByRole('button', { name: 'Fullscreen' }));

	await waitFor(() =>
		expect(dispatchToastMessage).toHaveBeenCalledWith({ type: 'error', message: 'Switching to fullscreen was not allowed' }),
	);
});

it('is unavailable where the browser has no fullscreen', () => {
	Object.defineProperty(document, 'fullscreenEnabled', { value: false, configurable: true });
	renderShown();

	expect(screen.queryByRole('button', { name: 'Fullscreen' })).not.toBeInTheDocument();
});
