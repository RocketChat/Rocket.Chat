import Tile from './Tile.js';
import { render } from '../../testing.js';

describe('[Tile Component]', () => {
	it('renders without crashing', () => {
		render(<Tile />);
	});
});
