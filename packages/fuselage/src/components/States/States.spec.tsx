import States from './States.js';
import { render } from '../../testing.js';

describe('[States Component]', () => {
	it('renders without crashing', () => {
		render(<States />);
	});
});
