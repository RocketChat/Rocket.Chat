import { composeStories } from '@storybook/react';
import { act, fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import * as stories from './VideoPlayer.stories';
import { render } from '../../testing';

const { Default } = composeStories(stories);

const getVideo = (container: HTMLElement) => container.querySelector('video') as HTMLVideoElement;

describe('[VideoPlayer Component]', () => {
	beforeEach(() => {
		jest.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
		jest.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => undefined);
	});

	afterEach(() => jest.restoreAllMocks());

	it('shows only the play button before the video starts', () => {
		render(<Default />);
		expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument();
		expect(screen.queryByRole('slider')).not.toBeInTheDocument();
	});

	it('shows the controls once the video plays', () => {
		const { container } = render(<Default />);
		fireEvent.play(getVideo(container));
		expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();
		expect(screen.getByRole('slider', { name: 'Video Playback Range' })).toBeInTheDocument();
		expect(screen.getByText('0:00 / 0:00')).toBeInTheDocument();
	});

	it('replaces the controls with an error and reloads on retry', async () => {
		const { container } = render(<Default />);
		fireEvent.play(getVideo(container));
		expect(screen.getByRole('slider')).toBeInTheDocument();
		fireEvent.error(getVideo(container));
		expect(screen.getByRole('alert')).toHaveTextContent("This video can't be played here");
		expect(screen.queryByRole('slider')).not.toBeInTheDocument();
		expect(screen.queryByRole('button', { name: 'Pause' })).not.toBeInTheDocument();
		await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
		expect(HTMLMediaElement.prototype.load).toHaveBeenCalled();
		expect(screen.queryByRole('alert')).not.toBeInTheDocument();
	});

	it('stops showing the loading state once a retried video has its metadata', async () => {
		const { container } = render(<Default />);
		fireEvent.error(getVideo(container));
		await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
		expect(screen.getByLabelText('Loading')).toBeInTheDocument();
		fireEvent.loadedMetadata(getVideo(container));
		expect(screen.queryByLabelText('Loading')).not.toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument();
	});

	it('reloads when the source changes', () => {
		const { container, rerender } = render(<Default />);
		fireEvent.play(getVideo(container));
		expect(HTMLMediaElement.prototype.load).not.toHaveBeenCalled();
		rerender(<Default src='https://example.com/other.mp4' />);
		expect(HTMLMediaElement.prototype.load).toHaveBeenCalledTimes(1);
		expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument();
		expect(screen.queryByRole('slider')).not.toBeInTheDocument();
	});

	it('keeps the controls reachable from the keyboard while the video plays', async () => {
		// jsdom never matches `:focus-visible`; keyboard focus always would.
		const { matches } = Element.prototype;
		jest.spyOn(Element.prototype, 'matches').mockImplementation(function (this: Element, selector: string) {
			return selector === ':focus-visible' ? this === this.ownerDocument.activeElement : matches.call(this, selector);
		});
		jest.useFakeTimers();
		const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
		const { container } = render(<Default />);
		const video = getVideo(container);
		fireEvent.play(video);
		fireEvent.playing(video);
		act(() => jest.advanceTimersByTime(3000));
		expect(screen.queryByRole('slider')).not.toBeInTheDocument();

		await user.tab();
		expect(video).toHaveFocus();
		await user.tab();
		const range = screen.getByRole('slider', { name: 'Video Playback Range' });
		expect(range).toHaveFocus();
		act(() => jest.advanceTimersByTime(3000));
		expect(screen.getByRole('button', { name: 'Pause' })).toBeVisible();
		jest.useRealTimers();
	});
});
