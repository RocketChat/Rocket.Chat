import { Icon } from './index.js';
import { render } from '../../testing.js';

describe('[Icon Component]', () => {
	it('renders without crashing', () => {
		render(<Icon name='chat' />);
	});
});
