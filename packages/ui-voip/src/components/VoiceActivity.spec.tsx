import { render } from '@testing-library/react';

import VoiceActivity from './VoiceActivity';

const mockUseAudioLevel = jest.fn();

jest.mock('../providers/useAudioLevel', () => ({
	useAudioLevel: (stream?: MediaStream | null) => mockUseAudioLevel(stream),
}));

const barHeights = (container: HTMLElement) =>
	Array.from(container.querySelectorAll('div[aria-hidden="true"] > div')).map((bar) => parseInt((bar as HTMLElement).style.height, 10));

beforeEach(() => {
	mockUseAudioLevel.mockReturnValue(0);
});

it('draws three bars with the middle one leading, so it reads as a voice', () => {
	const { container } = render(<VoiceActivity level={1} size={20} />);

	const [left, middle, right] = barHeights(container);

	expect(middle).toBeGreaterThan(left);
	expect(middle).toBeGreaterThan(right);
});

// The whole point of it: a mic that is on but picking nothing up has to look different from one being talked into.
it('grows with the level', () => {
	const quiet = render(<VoiceActivity level={0} size={20} />);
	const loud = render(<VoiceActivity level={1} size={20} />);

	barHeights(loud.container).forEach((height, index) => {
		expect(height).toBeGreaterThan(barHeights(quiet.container)[index]);
	});
});

// A row of equal dots says "on, and hearing nothing". Unequal bars would claim a voice that isn't there, and
// nothing at all would read as broken.
it('rests as three equal dots', () => {
	const { container } = render(<VoiceActivity level={0} size={20} />);

	const [left, middle, right] = barHeights(container);

	expect(left).toBe(middle);
	expect(middle).toBe(right);
	expect(left).toBeGreaterThan(0);
});

// Where a call shows it — over a tile, beside a name — it wears the blue disc that means "live".
it('can wear a disc, sized around the bars', () => {
	const { container } = render(<VoiceActivity level={0} size={20} badge />);

	expect((container.firstChild as HTMLElement).style.width).toBe('30px');
});

describe('where the level comes from', () => {
	it('measures the stream it is given', () => {
		const stream = { id: 'mic' } as unknown as MediaStream;
		mockUseAudioLevel.mockReturnValue(1);

		const { container } = render(<VoiceActivity stream={stream} size={20} />);

		expect(mockUseAudioLevel).toHaveBeenCalledWith(stream);
		expect(Math.max(...barHeights(container))).toBe(20);
	});

	// A caller that already measures its own — a tile lighting its speaking ring — should not open a second
	// analyser on the same microphone just to draw this.
	it('measures nothing when it is handed a level', () => {
		render(<VoiceActivity level={0.5} stream={{ id: 'mic' } as unknown as MediaStream} size={20} />);

		expect(mockUseAudioLevel).toHaveBeenCalledWith(null);
	});
});
