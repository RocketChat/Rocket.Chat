import Tabs from './Tabs.js';
import TabsItem from './TabsItem.js';
import { render } from '../../testing.js';

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
