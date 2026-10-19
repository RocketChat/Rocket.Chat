import Margins from './Margins';
import { render } from '../../testing';

describe('[Margins Component]', () => {
	it('renders without crashing', () => {
		render(<Margins />);
	});

	it('patches non-`Box` children', () => {
		const { container } = render(
			<Margins all='10px'>
				<div />
			</Margins>,
		);

		expect(container.firstElementChild).toHaveCssInJsClass();
	});
});
