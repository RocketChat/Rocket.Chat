import { MockedServerContext } from '@rocket.chat/mock-providers';
import type * as UiKit from '@rocket.chat/ui-kit';
import { BlockContext } from '@rocket.chat/ui-kit';
import { render, screen } from '@testing-library/react';

import LinearScaleElement from './LinearScaleElement';
import { messageParser } from '../surfaces';

const renderLinearScale = (range: Pick<UiKit.LinearScaleElement, 'minValue' | 'maxValue'>) => {
	const block: UiKit.LinearScaleElement = {
		type: 'linear_scale',
		appId: 'test',
		blockId: 'test',
		actionId: 'test',
		...range,
	};

	render(
		<MockedServerContext>
			<LinearScaleElement index={0} block={block} context={BlockContext.ACTION} surfaceRenderer={messageParser} />
		</MockedServerContext>,
	);
};

it('renders one button per point of the range', () => {
	renderLinearScale({ minValue: 1, maxValue: 5 });

	expect(screen.getAllByRole('button').map((button) => button.textContent)).toEqual(['1', '2', '3', '4', '5']);
});

it('renders the default range when none is given', () => {
	renderLinearScale({});

	expect(screen.getAllByRole('button')).toHaveLength(11);
});

it('limits the number of points it renders', () => {
	renderLinearScale({ minValue: 0, maxValue: 4294967295 });

	expect(screen.getAllByRole('button')).toHaveLength(100);
});

it('renders no points when the range is not numeric', () => {
	renderLinearScale({ maxValue: 'x' as unknown as number });

	expect(screen.queryAllByRole('button')).toHaveLength(0);
});
