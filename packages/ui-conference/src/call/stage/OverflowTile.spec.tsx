import { render, screen } from '@testing-library/react';
import i18next from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';

import OverflowTile from './OverflowTile';

const i18n = i18next.createInstance();
void i18n.use(initReactI18next).init({
	lng: 'en',
	resources: { en: { translation: { Others_count_one: '{{count}} other', Others_count_other: '{{count}} others' } } },
	initAsync: false,
});

const people = (count: number) => Array.from({ length: count }, (_, i) => ({ displayName: `Person ${i}` }));

const renderTile = (hidden: { displayName: string; avatarUrl?: string }[]) =>
	render(
		<I18nextProvider i18n={i18n}>
			<OverflowTile hidden={hidden} />
		</I18nextProvider>,
	);

// Two faces are shown, so the count is of the people behind them.
it('counts only the people who have no face shown', () => {
	renderTile(people(4));

	expect(screen.getByText('2 others')).toBeInTheDocument();
});

// The faces are the only place these people appear on the stage, so they are named, avatar or not.
it('names the faces it shows', () => {
	renderTile([{ displayName: 'Ada', avatarUrl: '/avatar/ada' }, { displayName: 'Grace' }, { displayName: 'Alan' }]);

	expect(screen.getByRole('img', { name: 'Ada' })).toBeInTheDocument();
	expect(screen.getByRole('img', { name: 'Grace' })).toBeInTheDocument();
});

it('says "1 other" for a single one behind the faces', () => {
	renderTile(people(3));

	expect(screen.getByText('1 other')).toBeInTheDocument();
});
