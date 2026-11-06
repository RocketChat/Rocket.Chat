import { composeStories } from '@storybook/react';
import { fireEvent, screen } from '@testing-library/react';
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
		fireEvent.error(getVideo(container));
		expect(screen.getByRole('alert')).toHaveTextContent("This video can't be played here");
		await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
		expect(HTMLMediaElement.prototype.load).toHaveBeenCalled();
		expect(screen.queryByRole('alert')).not.toBeInTheDocument();
	});
});
