import Tabs from './Tabs';
import TabsItem from './TabsItem';
import { render } from '../../testing';

describe('[Tabs Component]', () => {
	it('renders without crashing', () => {
		render(<Tabs />);
	});

	it('renders a disabled tab as a disabled button', () => {
		const { getByRole } = render(
			<Tabs>
				<TabsItem disabled>Tab</TabsItem>
			</Tabs>,
		);

		expect(getByRole('tab')).toBeDisabled();
	});
});
