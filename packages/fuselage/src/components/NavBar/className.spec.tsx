import { screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { createRef } from 'react';

import NavBar from './NavBar';
import NavBarGroup from './NavBarGroup';
import NavBarItem from './NavBarItem';
import NavBarSection from './NavBarSection';
import { render } from '../../testing';
import Pagination from '../Pagination/Pagination';
import Position from '../PositionAnimated/Position';

const cases: { name: string; element: ReactElement; ownClass: string }[] = [
	{ name: 'NavBar', element: <NavBar data-testid='part' className='custom' />, ownClass: 'rcx-navbar' },
	{ name: 'NavBarGroup', element: <NavBarGroup data-testid='part' className='custom' />, ownClass: 'rcx-navbar-group' },
	{ name: 'NavBarSection', element: <NavBarSection data-testid='part' className='custom' />, ownClass: 'rcx-navbar-section' },
	{
		name: 'NavBarItem with an icon',
		element: <NavBarItem data-testid='part' className='custom' icon='bell' />,
		ownClass: 'rcx-navbar-item',
	},
	{ name: 'Pagination', element: <Pagination data-testid='part' className='custom' count={10} />, ownClass: 'rcx-pagination' },
];

describe('consumer className on NavBar and Pagination', () => {
	it.each(cases)('$name keeps its own class next to the consumer one', ({ element, ownClass }) => {
		render(element);

		expect(screen.getByTestId('part')).toHaveClass(ownClass, 'custom');
	});

	it('NavBarItem keeps the child class, its own class and the consumer one', () => {
		render(
			<NavBarItem className='custom'>
				<button data-testid='part' className='child' />
			</NavBarItem>,
		);

		expect(screen.getByTestId('part')).toHaveClass('child', 'rcx-navbar-item', 'custom');
	});
});

describe('Position', () => {
	it('forwards className to the positioned child', () => {
		const anchor = createRef<HTMLElement>();

		render(
			<Position anchor={anchor} className='custom'>
				<div data-testid='part' className='child' />
			</Position>,
		);

		expect(screen.getByTestId('part')).toHaveClass('child', 'custom');
	});
});
