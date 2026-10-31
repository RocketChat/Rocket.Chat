import ThreadMessage from './ThreadMessage';
import { render } from '../../../testing';

it('renders without crashing', () => {
	render(<ThreadMessage />);
});
