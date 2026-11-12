// Fixtures break these rules on purpose, to prove the helpers catch it.
/* oxlint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions, jsx-a11y/no-noninteractive-tabindex, jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/anchor-is-valid, jsx-a11y/interactive-supports-focus, react/no-multi-comp */
import { render } from '@testing-library/react';
import { createRef, useState } from 'react';
import { fn } from 'storybook/test';

import {
	ariaSnapshot,
	classContract,
	expectCombobox,
	expectCompositeList,
	expectForwards,
	expectKeyboardActivation,
	expectMenu,
	expectTabOrder,
} from './g0';

describe('expectForwards', () => {
	const setup = (className: string) => {
		const ref = createRef<HTMLButtonElement>();
		const onClick = fn();
		const { container } = render(
			<button ref={ref} className={className} id='a' data-qa='qa' onClick={onClick}>
				x
			</button>,
		);
		return { container, ref, onClick };
	};

	it('passes when the attributes, class order, ref and handlers reach the element', async () => {
		const { container, ref, onClick } = setup('rcx-box mine');
		await expectForwards(container, 'button', { 'className': 'mine', 'id': 'a', 'data-qa': 'qa', ref, 'handlers': { onClick } });
	});

	it('fires the events React derives focus and hover props from', async () => {
		const [onFocus, onBlur, onMouseEnter, onMouseLeave] = [fn(), fn(), fn(), fn()];
		const { container } = render(
			<button onFocus={onFocus} onBlur={onBlur} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
				x
			</button>,
		);
		await expectForwards(container, 'button', { handlers: { onFocus, onBlur, onMouseEnter, onMouseLeave } });
	});

	it('fails when the class comes before an rcx class', async () => {
		const { container } = setup('mine rcx-box');
		await expect(expectForwards(container, 'button', { className: 'mine' })).rejects.toThrow();
	});

	it('fails when an attribute is not forwarded', async () => {
		const { container } = setup('rcx-box');
		await expect(expectForwards(container, 'button', { title: 'missing' })).rejects.toThrow();
	});

	it('fails when a handler is not wired', async () => {
		const { container } = setup('rcx-box');
		await expect(expectForwards(container, 'button', { handlers: { onFocus: fn() } })).rejects.toThrow();
	});
});

describe('ariaSnapshot and classContract', () => {
	it('serialises role, name and states, and skips hidden nodes', () => {
		const { container } = render(
			<div>
				<button disabled>Save</button>
				<input type='checkbox' aria-label='Agree' defaultChecked />
				<span aria-hidden='true'>icon</span>
			</div>,
		);
		expect(ariaSnapshot(container)).toBe('- button "Save" [disabled]\n- checkbox "Agree" [checked]');
	});

	it('models heading levels, content names, presentational roles and inputs', () => {
		const { container } = render(
			<div>
				<h2>
					Title <span>3</span>
				</h2>
				<ul>
					<li role='presentation'>plain</li>
				</ul>
				<input type='hidden' />
				<input type='number' aria-label='Qty' />
				<select multiple aria-label='Tags'>
					<option>a</option>
				</select>
				<div style={{ display: 'none' }}>
					<button>gone</button>
				</div>
				<button style={{ visibility: 'hidden' }}>invisible</button>
			</div>,
		);
		expect(ariaSnapshot(container)).toBe(
			['- heading "Title 3" [level=2]', '- list:', '  - text: "plain"', '- spinbutton "Qty"', '- listbox "Tags":', '  - option "a"'].join(
				'\n',
			),
		);
	});

	it('lists the rcx classes per element path without generated classes', () => {
		const { container } = render(
			<ul className='rcx-list rcx-css-abc123'>
				<li className='rcx-item rcx-a'>1</li>
				<li>2</li>
			</ul>,
		);
		expect(classContract(container.firstElementChild as Element)).toBe('root: rcx-list\nroot > li[0]: rcx-a rcx-item');
	});
});

describe('keyboard helpers', () => {
	it('checks Enter and Space activation, and the tab order', async () => {
		const onClick = fn();
		const { getByText } = render(
			<>
				<button onClick={onClick}>one</button>
				<button>two</button>
			</>,
		);
		await expectKeyboardActivation(getByText('one'), onClick);
		await expectTabOrder([getByText('one'), getByText('two')]);
	});

	it('detects a button that ignores the keyboard', async () => {
		const onClick = fn();
		const { getByText } = render(
			<span tabIndex={0} onClick={onClick}>
				one
			</span>,
		);
		await expect(expectKeyboardActivation(getByText('one'), onClick)).rejects.toThrow();
	});

	it('checks a composite list where Tab never enters the next row', async () => {
		const Rows = () => {
			const [active, setActive] = useState(0);
			return (
				<>
					<ul
						onKeyDown={(event) => {
							if (event.key === 'ArrowDown') setActive(1);
							if (event.key === 'ArrowUp') setActive(0);
						}}
					>
						{[0, 1].map((index) => (
							<li key={index}>
								<a href='#' tabIndex={active === index ? 0 : -1} ref={(el) => void (active === index && el?.focus())}>
									row {index}
								</a>
							</li>
						))}
					</ul>
					<button>after</button>
				</>
			);
		};
		const { container, getByText } = render(<Rows />);
		await expectCompositeList(container.querySelector('ul') as HTMLElement, getByText('row 0'));
	});

	it('finds the rows of a list that uses Fuselage item classes', async () => {
		const Rows = () => {
			const [active, setActive] = useState(0);
			return (
				<>
					<div
						onKeyDown={(event) => {
							if (event.key === 'ArrowDown') setActive(1);
							if (event.key === 'ArrowUp') setActive(0);
						}}
					>
						{[0, 1].map((index) => (
							<div key={index} className='rcx-item'>
								<a href='#' tabIndex={active === index ? 0 : -1} ref={(el) => void (active === index && el?.focus())}>
									row {index}
								</a>
							</div>
						))}
					</div>
					<button>after</button>
				</>
			);
		};
		const { container, getByText } = render(<Rows />);
		await expectCompositeList(container.firstElementChild as HTMLElement, getByText('row 0'));
	});

	it('checks a combobox that moves aria-activedescendant', async () => {
		const onPick = fn();
		const Combo = () => {
			const [active, setActive] = useState(-1);
			return (
				<>
					<input
						role='combobox'
						aria-expanded
						aria-controls='list'
						aria-activedescendant={active >= 0 ? `o${active}` : undefined}
						onKeyDown={(event) => {
							if (event.key === 'ArrowDown') setActive((index) => Math.min(index + 1, 1));
							if (event.key === 'ArrowUp') setActive((index) => Math.max(index - 1, 0));
							if (event.key === 'Enter') onPick();
						}}
					/>
					<ul id='list' role='listbox'>
						<li id='o0' role='option' aria-selected={active === 0}>
							a
						</li>
						<li id='o1' role='option' aria-selected={active === 1}>
							b
						</li>
					</ul>
				</>
			);
		};
		const { getByRole, getAllByRole } = render(<Combo />);
		await expectCombobox(getByRole('combobox'), getAllByRole('option'), onPick);
	});

	it('checks a menu that opens, moves focus and closes on Escape', async () => {
		const Menu = () => {
			const [open, setOpen] = useState(false);
			return (
				<>
					<button onKeyDown={(event) => event.key === 'Enter' && setOpen(true)}>trigger</button>
					{open && (
						<div
							role='menu'
							onKeyDown={(event) => {
								const items = [...event.currentTarget.querySelectorAll<HTMLElement>('[role=menuitem]')];
								if (event.key === 'ArrowDown') items[1].focus();
								if (event.key === 'Escape') {
									setOpen(false);
									document.querySelector<HTMLElement>('button')?.focus();
								}
							}}
						>
							<button role='menuitem' ref={(el) => el?.focus()}>
								a
							</button>
							<button role='menuitem'>b</button>
						</div>
					)}
				</>
			);
		};
		const { getByText, queryAllByRole } = render(<Menu />);
		await expectMenu(getByText('trigger'), () => queryAllByRole('menuitem'));
	});
});
