import { render, screen } from '@testing-library/react';

import VoiceActivity from './VoiceActivity';

const barHeights = () => screen.getAllByTestId('voice-activity-bar').map((bar) => parseInt(bar.style.height, 10));

/** A microphone with no audio track, which is all a test can hand over: it shows whether it was read, not a level. */
const silentStream = () => ({ getAudioTracks: jest.fn(() => []) }) as unknown as MediaStream & { getAudioTracks: jest.Mock };

it('draws three bars with the middle one leading, so it reads as a voice', () => {
	render(<VoiceActivity level={1} size={20} />);

	const [left, middle, right] = barHeights();

	expect(middle).toBeGreaterThan(left);
	expect(middle).toBeGreaterThan(right);
});

// The whole point of it: a mic that is on but picking nothing up has to look different from one being talked into.
it('grows with the level', () => {
	const quiet = render(<VoiceActivity level={0} size={20} />);
	const quietHeights = barHeights();
	quiet.unmount();

	render(<VoiceActivity level={1} size={20} />);

	barHeights().forEach((height, index) => {
		expect(height).toBeGreaterThan(quietHeights[index]);
	});
});

// A row of equal dots says "on, and hearing nothing". Unequal bars would claim a voice that isn't there, and
// nothing at all would read as broken.
it('rests as three equal dots', () => {
	render(<VoiceActivity level={0} size={20} />);

	const [left, middle, right] = barHeights();

	expect(left).toBe(middle);
	expect(middle).toBe(right);
	expect(left).toBeGreaterThan(0);
});

// Where a call shows it — over a tile, beside a name — it wears the blue disc that means "live".
it('can wear a disc, sized around the bars', () => {
	render(<VoiceActivity level={0} size={20} badge />);

	expect(screen.getByTestId('voice-activity-badge')).toHaveStyle({ width: '30px' });
});

describe('where the level comes from', () => {
	it('measures the stream it is given', () => {
		const stream = silentStream();

		render(<VoiceActivity stream={stream} size={20} />);

		expect(stream.getAudioTracks).toHaveBeenCalled();
	});

	// A caller that already measures its own — a tile lighting its speaking ring — should not open a second
	// analyser on the same microphone just to draw this.
	it('measures nothing when it is handed a level', () => {
		const stream = silentStream();

		render(<VoiceActivity level={0.5} stream={stream} size={20} />);

		expect(stream.getAudioTracks).not.toHaveBeenCalled();
	});
});
