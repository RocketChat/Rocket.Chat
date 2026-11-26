import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { PressTarget } from './PressTarget';

const renderPressTarget = PressTarget;

it('adds no element around its children', () => {
	const { container } = render(
		<PressTarget press={{ onPress: jest.fn(), onLongPress: jest.fn(), disabled: true, role: 'button' }}>
			<span>Tag</span>
		</PressTarget>,
	);

	expect(container.innerHTML).toBe('<span>Tag</span>');
});

it('leaves the press to the render element of the frame', async () => {
	const onPress = jest.fn();
	render(
		<PressTarget press={{ onPress }}>
			<button type='button' onClick={() => onPress()}>
				Save
			</button>
		</PressTarget>,
	);

	await userEvent.click(screen.getByRole('button'));

	expect(onPress).toHaveBeenCalledTimes(1);
});

it('hands its children back as the same element, with no wrapper', () => {
	const child = <span>Tag</span>;
	const { props } = renderPressTarget({ press: { onPress: jest.fn() }, children: child });

	expect(props.children).toBe(child);
});
