import { composeStories } from '@storybook/react-webpack5';

import { render } from '../../testing';
import { Item, ItemContent, ItemTitle } from '../Item';
import Options from './Options';
import * as stories from './Options.stories';

const { Default } = composeStories(stories);

describe('[Message Component]', () => {
	it('renders without crashing', () => {
		render(<Default />);
	});
});

describe('[Options]', () => {
	it('should scroll to the row focused by the cursor when it renders as `Item`', () => {
		const options = Array.from({ length: 10 }, (_, i) => [i, `Option ${i}`] as [number, string]);
		const offsetTop = jest.spyOn(HTMLElement.prototype, 'offsetTop', 'get').mockImplementation(function (this: HTMLElement) {
			return Number(this.dataset.index ?? 0) * 40;
		});
		const clientHeight = jest.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(function (this: HTMLElement) {
			return this.getAttribute('role') === 'listbox' ? 120 : 40;
		});

		const { getByRole } = render(
			<Options
				options={options}
				cursor={8}
				onSelect={() => undefined}
				renderItem={({ label, focus, value, selected, ...props }) => (
					<Item {...props} is='li' data-index={value} focused={focus} aria-selected={!!selected}>
						<ItemContent>
							<ItemTitle>{label}</ItemTitle>
						</ItemContent>
					</Item>
				)}
			/>,
		);

		expect(getByRole('listbox').scrollTop).toBe(320);

		offsetTop.mockRestore();
		clientHeight.mockRestore();
	});
});
