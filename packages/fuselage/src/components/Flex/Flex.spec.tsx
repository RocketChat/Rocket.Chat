import { FlexContainer, FlexItem } from './index.js';
import { render } from '../../testing.js';

describe('[Flex Component]', () => {
	it('renders FlexContainer without crashing', () => {
		render(<FlexContainer />);
	});

	it('renders FlexItem without crashing', () => {
		render(<FlexItem />);
	});
});
