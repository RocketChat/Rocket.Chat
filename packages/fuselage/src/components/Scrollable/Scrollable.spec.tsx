import Scrollable from './Scrollable.js';
import { render } from '../../testing.js';

describe('Scrollabe Component', () => {
	it('renders without crashing', () => {
		render(<Scrollable />);
	});
});
