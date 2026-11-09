import Tile from './Tile';
import { render } from '../../testing';

describe('[Tile Component]', () => {
	it('renders without crashing', () => {
		render(<Tile />);
	});
});
