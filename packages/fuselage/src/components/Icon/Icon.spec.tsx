import { Icon } from '.';
import { render } from '../../testing';

describe('[Icon Component]', () => {
	it('renders without crashing', () => {
		render(<Icon name='chat' />);
	});
});
