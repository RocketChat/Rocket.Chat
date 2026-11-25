import { screen } from '@testing-library/react';

import AudioPlayer from './AudioPlayer';
import { render } from '../../testing';

describe('[AudioPlayer root props]', () => {
	it('merges className and forwards HTML props to the root', () => {
		render(<AudioPlayer src='audio.mp3' className='custom' data-testid='player' />);

		expect(screen.getByTestId('player')).toHaveClass('rcx-audio-player', 'custom');
	});
});
