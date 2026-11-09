import { MessageDivider } from './index.js';
import { render } from '../../../testing.js';

it('renders without crashing', () => {
	render(<MessageDivider />);
});
