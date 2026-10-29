import Margins from './Margins';
import { render } from '../../testing';

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


	it('applies a zero margin to non-`Box` children', () => {
		const { container } = render(
			<Margins all={0}>
				<div />
			</Margins>,
		);

		expect(container.firstElementChild).toHaveCssInJsClass();
		expect(container.firstElementChild).toHaveStyle({ margin: '0px' });
	});
});
