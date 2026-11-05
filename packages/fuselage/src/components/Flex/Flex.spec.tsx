import { FlexContainer, FlexItem } from '.';
import { render } from '../../testing';
import { Box } from '../Box';

describe('[Flex Component]', () => {
	it('renders FlexContainer without crashing', () => {
		render(<FlexContainer />);
	});

	it('renders FlexItem without crashing', () => {
		render(<FlexItem />);
	});

	describe('FlexItem basis prop', () => {
		it('supports numeric basis by converting to pixels', () => {
			const { container } = render(
				<FlexItem basis={200}>
					<Box />
				</FlexItem>,
			);

			expect(container.firstElementChild).toHaveStyle({
				flexBasis: '200px',
			});
		});

		it('supports numeric zero basis by converting to 0px', () => {
			const { container } = render(
				<FlexItem basis={0}>
					<Box />
				</FlexItem>,
			);

			expect(container.firstElementChild).toHaveStyle({
				flexBasis: '0px',
			});
		});

		it('supports pixel string basis', () => {
			const { container } = render(
				<FlexItem basis='400px'>
					<Box />
				</FlexItem>,
			);

			expect(container.firstElementChild).toHaveStyle({
				flexBasis: '400px',
			});
		});

		it('supports percentage string basis', () => {
			const { container } = render(
				<FlexItem basis='50%'>
					<Box />
				</FlexItem>,
			);

			expect(container.firstElementChild).toHaveStyle({
				flexBasis: '50%',
			});
		});

		it('supports "auto" string basis', () => {
			const { container } = render(
				<FlexItem basis='auto'>
					<Box />
				</FlexItem>,
			);

			expect(container.firstElementChild).toHaveStyle({
				flexBasis: 'auto',
			});
		});

		it('does not override explicit flexBasis defined on child Box', () => {
			const { container } = render(
				<FlexItem basis={200}>
					<Box flexBasis='100px' />
				</FlexItem>,
			);

			expect(container.firstElementChild).toHaveStyle({
				flexBasis: '100px',
			});
		});
	});
});
