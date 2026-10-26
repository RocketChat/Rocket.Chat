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

const cases: [string, ReactElement, string][] = [
	['States', <States data-testid='part' className='custom' />, 'rcx-states'],
	['StatesTitle', <StatesTitle data-testid='part' className='custom' />, 'rcx-states__title'],
	['StatesSubtitle', <StatesSubtitle data-testid='part' className='custom' />, 'rcx-states__subtitle'],
	['StatesSuggestion', <StatesSuggestion data-testid='part' className='custom' />, 'rcx-states__suggestion'],
	['StatesSuggestionList', <StatesSuggestionList data-testid='part' className='custom' />, 'rcx-states__list'],
	['StatesSuggestionListItem', <StatesSuggestionListItem data-testid='part' className='custom' />, 'rcx-states__list-item'],
	['StatesSuggestionText', <StatesSuggestionText data-testid='part' className='custom' />, 'rcx-states__suggestion-text'],
	[
		'StatesIcon',
		<StatesIcon data-testid='part' className='custom' name='circle-exclamation' variation='danger' />,
		'rcx-states__icon--danger',
	],
];

describe('consumer className on States parts', () => {
	it.each(cases)('%s keeps its own class next to the consumer one', (_name, element, ownClass) => {
		render(element);

		expect(screen.getByTestId('part')).toHaveClass(ownClass, 'custom');
	});
});
