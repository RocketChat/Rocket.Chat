import Option from './Option';
import OptionContent from './OptionContent';
import { prevent } from '../../helpers/prevent';
import { render } from '../../testing';

jest.mock('../../helpers/prevent');

describe('Option', () => {
	it('renders without crashing', () => {
		render(
			<Option>
				<OptionContent>Lorem Ipsum Lorem</OptionContent>
			</Option>,
		);
	});

	it('should call onClick when click', () => {
		const click = jest.fn();

		const { getByText } = render(
			<Option onClick={click}>
				<OptionContent>Option</OptionContent>
			</Option>,
		);

		getByText('Option').click();

		expect(click).toHaveBeenCalledTimes(1);
	});

	it('should call prevent when click on disabled', () => {
		const click = jest.fn();

		const { getByText } = render(
			<Option disabled onClick={click}>
				<OptionContent>Option</OptionContent>
			</Option>,
		);

		getByText('Option').click();

		expect(click).toHaveBeenCalledTimes(0);
		expect(prevent).toHaveBeenCalledTimes(1);
	});
});
