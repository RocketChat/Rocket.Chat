import { FlexContainer, FlexItem } from '.';
import { render } from '../../testing';

describe('[Flex Component]', () => {
	it('renders FlexContainer without crashing', () => {
		render(<FlexContainer />);
	});

	it('renders FlexItem without crashing', () => {
		render(<FlexItem />);
	});
});
