import ThreadMessage from './ThreadMessage.js';
import { render } from '../../../testing.js';

it('renders without crashing', () => {
	render(<ThreadMessage />);
});
