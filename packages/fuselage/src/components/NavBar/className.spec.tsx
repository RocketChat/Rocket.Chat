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

const cases: [string, ReactElement, string][] = [
	['NavBar', <NavBar data-testid='part' className='custom' />, 'rcx-navbar'],
	['NavBarGroup', <NavBarGroup data-testid='part' className='custom' />, 'rcx-navbar-group'],
	['NavBarSection', <NavBarSection data-testid='part' className='custom' />, 'rcx-navbar-section'],
	['NavBarItem with an icon', <NavBarItem data-testid='part' className='custom' icon='bell' />, 'rcx-navbar-item'],
	['Pagination', <Pagination data-testid='part' className='custom' count={10} />, 'rcx-pagination'],
];

describe('consumer className on NavBar and Pagination', () => {
	it.each(cases)('%s keeps its own class next to the consumer one', (_name, element, ownClass) => {
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
