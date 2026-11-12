import { screen } from '@testing-library/react';
import type { ReactElement } from 'react';

import {
	States,
	StatesIcon,
	StatesSubtitle,
	StatesSuggestion,
	StatesSuggestionList,
	StatesSuggestionListItem,
	StatesSuggestionText,
	StatesTitle,
} from '.';
import { render } from '../../testing';

const cases: { name: string; element: ReactElement; ownClass: string }[] = [
	{ name: 'States', element: <States data-testid='part' className='custom' />, ownClass: 'rcx-states' },
	{ name: 'StatesTitle', element: <StatesTitle data-testid='part' className='custom' />, ownClass: 'rcx-states__title' },
	{ name: 'StatesSubtitle', element: <StatesSubtitle data-testid='part' className='custom' />, ownClass: 'rcx-states__subtitle' },
	{ name: 'StatesSuggestion', element: <StatesSuggestion data-testid='part' className='custom' />, ownClass: 'rcx-states__suggestion' },
	{ name: 'StatesSuggestionList', element: <StatesSuggestionList data-testid='part' className='custom' />, ownClass: 'rcx-states__list' },
	{
		name: 'StatesSuggestionListItem',
		element: <StatesSuggestionListItem data-testid='part' className='custom' />,
		ownClass: 'rcx-states__list-item',
	},
	{
		name: 'StatesSuggestionText',
		element: <StatesSuggestionText data-testid='part' className='custom' />,
		ownClass: 'rcx-states__suggestion-text',
	},
	{
		name: 'StatesIcon',
		element: <StatesIcon data-testid='part' className='custom' name='circle-exclamation' variation='danger' />,
		ownClass: 'rcx-states__icon--danger',
	},
];

describe('consumer className on States parts', () => {
	it.each(cases)('$name keeps its own class next to the consumer one', ({ element, ownClass }) => {
		render(element);

		expect(screen.getByTestId('part')).toHaveClass(ownClass, 'custom');
	});
});

describe('StatesIcon size', () => {
	it('lets the consumer set the size', () => {
		render(
			<>
				<StatesIcon data-testid='default' name='circle-exclamation' />
				<StatesIcon data-testid='custom' name='circle-exclamation' size='x16' />
			</>,
		);

		expect(screen.getByTestId('custom').className).not.toEqual(screen.getByTestId('default').className);
	});
});
