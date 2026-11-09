import Margins from './Margins.js';
import { render } from '../../testing.js';

describe('[Margins Component]', () => {
	it('renders without crashing', () => {
		render(<Margins />);
	});

	it('patches non-`Box` children', () => {
		const { container } = render(
			<Margins all='x8'>
				<div />
			</Margins>,
		);

		expect(container.firstElementChild).toHaveCssInJsClass();
	});
});
