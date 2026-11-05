import AudioPlayer from './AudioPlayer';
import { render } from '../../testing';

describe('[AudioPlayer root props]', () => {
	it('merges className and forwards HTML props to the root', () => {
		const { container } = render(<AudioPlayer src='audio.mp3' className='custom' data-testid='player' />);

		const root = container.querySelector('.rcx-audio-player');
		expect(root).toHaveClass('custom');
		expect(root).toHaveAttribute('data-testid', 'player');
	});
});
