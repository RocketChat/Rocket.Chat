import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { axe } from 'jest-axe';

import ScreenViewer from './ScreenViewer.js';

const LABEL = 'Ada Lovelace — screen';

const requestFullscreen = jest.fn();

const streamOf = (id: string) => ({ id }) as MediaStream;

const renderViewer = () =>
	render(<ScreenViewer stream={streamOf('screen')} label={LABEL} />, {
		wrapper: mockAppRoot()
			.withTranslations('en', 'core', {
				Zoom_in: 'Zoom in',
				Zoom_out: 'Zoom out',
				Zoom_level_percent: 'Zoom {{percent}}%',
				Fullscreen: 'Fullscreen',
				Exit_fullscreen: 'Exit fullscreen',
				Screen_share_zoomed_hint: 'Drag, or use the arrow keys, to move around the zoomed screen',
			})
			.build(),
	});

const viewer = () => screen.getByRole('group', { name: LABEL });

beforeEach(() => {
	jest.clearAllMocks();
	requestFullscreen.mockResolvedValue(undefined);

	jest.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
	jest.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined);
	Object.defineProperty(HTMLElement.prototype, 'requestFullscreen', { value: requestFullscreen, configurable: true });
	Object.defineProperty(document, 'fullscreenEnabled', { value: true, configurable: true });
});

it('zooms into the screen it shows, named by its label', async () => {
	const user = userEvent.setup();
	renderViewer();

	await user.click(screen.getByRole('button', { name: 'Zoom in' }));

	expect(viewer().querySelector('video')).toHaveStyle({ transform: 'translate(0%, 0%) scale(1.5)' });
});

// Fullscreen keeps whose screen it is and the controls over it, so zoom and leaving fullscreen stay at hand.
it('shows the screen fullscreen together with its label and controls', async () => {
	const user = userEvent.setup();
	renderViewer();

	await user.click(screen.getByRole('button', { name: 'Fullscreen' }));

	const [target] = requestFullscreen.mock.contexts;
	expect(target).toContainElement(viewer());
	expect(target).toContainElement(screen.getByText(LABEL));
	expect(target).toContainElement(screen.getByRole('button', { name: 'Zoom in' }));
	expect(target).toContainElement(screen.getByRole('button', { name: 'Fullscreen' }));
});

// Remounting it would drop the reader out of fullscreen and take the focus from under the keyboard.
it('starts another screen unzoomed, in the same viewer', async () => {
	const user = userEvent.setup();
	const { rerender } = renderViewer();
	await user.click(screen.getByRole('button', { name: 'Zoom in' }));
	const shown = viewer();

	rerender(<ScreenViewer stream={streamOf('another-screen')} label={LABEL} />);

	expect(viewer()).toBe(shown);
	expect(screen.getByRole('status')).toHaveTextContent('Zoom 100%');
	expect(screen.getByRole('button', { name: 'Zoom in' })).toHaveFocus();
});

it('offers no fullscreen where the browser has none', () => {
	Object.defineProperty(document, 'fullscreenEnabled', { value: false, configurable: true });
	renderViewer();

	expect(screen.queryByRole('button', { name: 'Fullscreen' })).not.toBeInTheDocument();
	expect(screen.getByRole('button', { name: 'Zoom in' })).toBeInTheDocument();
});

it('has no a11y violations while zoomed', async () => {
	const user = userEvent.setup();
	const { container } = renderViewer();
	await user.click(screen.getByRole('button', { name: 'Zoom in' }));

	expect(await axe(container)).toHaveNoViolations();
});
