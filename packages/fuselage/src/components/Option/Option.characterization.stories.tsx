import type { Meta, StoryObj } from '@storybook/react';
import { createRef } from 'react';
import { expect, fn, userEvent } from 'storybook/test';

import CheckOption from './CheckOption';
import Option from './Option';
import OptionAvatar from './OptionAvatar';
import OptionColumn from './OptionColumn';
import OptionContent from './OptionContent';
import OptionDescription from './OptionDescription';
import OptionDescriptionBlock from './OptionDescriptionBlock';
import OptionHeader from './OptionHeader';
import OptionIcon from './OptionIcon';
import OptionInput from './OptionInput';
import OptionMenu from './OptionMenu';
import OptionSkeleton from './OptionSkeleton';
import OptionTitle from './OptionTitle';
import { ariaSnapshot, classContract, expectForwards } from '../../testing/g0';

// G0 characterization of Option and its parts on their develop implementation. A rewrite passes these unedited, in jest and
// in the compiled zero-runtime Storybook; see src/testing/README.md. `li.rcx-option` and `.rcx-option__content` are located
// by the e2e tests.
export default {
	title: 'Characterization/Option',
	component: Option,
	tags: ['g0', '!autodocs'],
	parameters: { layout: 'centered' },
} satisfies Meta<typeof Option>;

type Story = StoryObj<typeof Option>;

const handlers = {
	onMouseEnter: fn(),
	onMouseLeave: fn(),
	onMouseDown: fn(),
	onMouseUp: fn(),
	onKeyDown: fn(),
	onKeyUp: fn(),
	onFocus: fn(),
	onBlur: fn(),
	onPointerDown: fn(),
	onPointerUp: fn(),
	onContextMenu: fn(),
};
const optionRef = createRef<HTMLElement>();
const onClick = fn();

const attributes = (name: string) => ({
	'className': `consumer-${name}`,
	'id': `${name}-id`,
	'title': `${name} title`,
	'data-qa': `${name}-qa`,
	'data-anything': `${name}-anything`,
	'aria-label': `${name} label`,
});

export const Forwarding: Story = {
	render: () => (
		<ul>
			<Option {...attributes('option')} ref={optionRef} {...handlers} onClick={onClick} label='Name' />
			<Option is='div' id='as-div' label='Div' />
		</ul>
	),
	play: async ({ canvasElement }) => {
		const option = canvasElement.querySelector('#option-id') as HTMLElement;
		await expectForwards(canvasElement, option, { ...attributes('option'), ref: optionRef, handlers });
		await expect(option.tagName).toBe('LI');
		await expect(option).toHaveClass('rcx-option', 'rcx-item');
		onClick.mockClear();
		await userEvent.click(option);
		await expect(onClick).toHaveBeenCalledTimes(1);
		await expect(canvasElement.querySelector('#as-div')?.tagName).toBe('DIV');
	},
};

const pointerMove = fn();

export const RowHandlers: Story = {
	render: () => (
		<ul>
			<Option id='row' label='Row' onPointerMove={pointerMove} />
			<Option id='off' label='Off' disabled />
		</ul>
	),
	play: async ({ canvasElement }) => {
		const row = canvasElement.querySelector('#row') as HTMLElement;
		await userEvent.hover(row);
		await expect(pointerMove).toHaveBeenCalled();
		const click = (element: Element) => {
			const event = new MouseEvent('click', { bubbles: true, cancelable: true });
			element.dispatchEvent(event);
			return event.defaultPrevented;
		};
		await expect(click(row)).toBe(false);
		await expect(click(canvasElement.querySelector('#off') as Element)).toBe(true);
	},
};

const selectedClick = fn();
const disabledClick = fn();

export const SelectedAndDisabled: Story = {
	render: () => (
		<ul>
			<Option id='plain' label='Plain' />
			<Option id='selected' label='Selected' selected onClick={selectedClick} />
			<Option id='disabled' label='Disabled' disabled onClick={disabledClick} />
		</ul>
	),
	play: async ({ canvasElement }) => {
		const get = (id: string) => canvasElement.querySelector(`#${id}`) as HTMLElement;
		await expect(get('plain')).toHaveAttribute('aria-selected', 'false');
		await expect(get('plain')).toHaveAttribute('aria-disabled', 'false');
		await expect(get('selected')).toHaveAttribute('aria-selected', 'true');
		await expect(get('selected')).toHaveClass('rcx-option--selected');
		await expect(get('disabled')).toHaveAttribute('aria-disabled', 'true');
		await expect(get('disabled')).toHaveClass('rcx-option--disabled');

		await userEvent.click(get('selected'));
		await expect(selectedClick).toHaveBeenCalledTimes(1);
		await userEvent.click(get('disabled'));
		await expect(disabledClick).not.toHaveBeenCalled();
	},
};

export const Structure: Story = {
	render: () => (
		<ul>
			<Option id='full' label='Label' icon='user' iconLabel='Federated' avatar={<span>avatar</span>} description={<span>desc</span>} />
			<Option id='gap' label='Gap' gap />
			<Option id='children'>
				<span id='custom-child'>custom</span>
			</Option>
			<Option id='both' label='Same'>
				extra
			</Option>
		</ul>
	),
	play: async ({ canvasElement }) => {
		const full = canvasElement.querySelector('#full') as HTMLElement;
		await expect(full.querySelector(':scope > .rcx-option__avatar')).not.toBeNull();
		await expect(full.querySelector(':scope > .rcx-option__column > .rcx-option__icon')).not.toBeNull();
		await expect(full.querySelector(':scope > .rcx-option__column')).toHaveAttribute('aria-label', 'Federated');
		await expect(full.querySelector(':scope > .rcx-option__content > .rcx-item__title')).toHaveTextContent('Label');
		await expect(full).toHaveClass('rcx-option--align-top');
		await expect(canvasElement.querySelector('#gap > .rcx-option__column')).not.toBeNull();
		await expect(canvasElement.querySelector('#children > .rcx-option__content')).toBeNull();
		await expect(canvasElement.querySelector('#both > .rcx-option__content')).not.toBeNull();
		await expect(canvasElement.querySelector('#both')).toHaveTextContent('Sameextra');
	},
};

const partClick = fn();
const partHandlers = { onFocus: fn(), onBlur: fn(), onMouseEnter: fn() };

export const PartsForwarding: Story = {
	render: () => (
		<ul>
			<OptionTitle {...attributes('title')} {...partHandlers}>
				Title
			</OptionTitle>
			<OptionHeader {...attributes('header')} {...partHandlers}>
				Header
			</OptionHeader>
			<Option>
				<OptionAvatar {...attributes('avatar')} {...partHandlers}>
					A
				</OptionAvatar>
				<OptionColumn {...attributes('column')} {...partHandlers}>
					C
				</OptionColumn>
				<OptionContent {...attributes('content')} {...partHandlers}>
					Content
				</OptionContent>
				<OptionDescription {...attributes('description')} {...partHandlers}>
					Description
				</OptionDescription>
				<OptionDescriptionBlock {...attributes('block')} {...partHandlers}>
					Block
				</OptionDescriptionBlock>
				<OptionInput {...attributes('input')} {...partHandlers} onClick={partClick}>
					In
				</OptionInput>
				<OptionMenu {...attributes('menu')} {...partHandlers}>
					Menu
				</OptionMenu>
			</Option>
		</ul>
	),
	play: async ({ canvasElement }) => {
		const parts = [
			['title', 'div'],
			['header', 'li'],
			['avatar', 'div'],
			['column', 'div'],
			['content', 'div'],
			['description', 'span'],
			['block', 'div'],
			['input', 'div'],
			['menu', 'div'],
		] as const;
		for (const [name, tag] of parts) {
			const element = canvasElement.querySelector(`#${name}-id`) as HTMLElement;
			await expect(element.tagName.toLowerCase()).toBe(tag);
			await expectForwards(canvasElement, element, { ...attributes(name), handlers: partHandlers });
		}
		await expectForwards(canvasElement, '#input-id', { handlers: { onClick: partClick } });
		await expect(canvasElement.querySelector('#header-id')).toHaveAttribute('role', 'presentation');
		await expect(canvasElement.querySelector('#content-id > .rcx-item__title')).toHaveTextContent('Content');
	},
};

export const IconPart: Story = {
	render: () => (
		<Option>
			<OptionIcon name='user' className='consumer-icon' data-qa='icon-qa' />
		</Option>
	),
	play: async ({ canvasElement }) => {
		const column = canvasElement.querySelector('.rcx-option__column') as HTMLElement;
		await expect(column).toHaveAttribute('aria-hidden', 'true');
		const icon = column.querySelector('i') as HTMLElement;
		await expect(icon).toHaveClass('rcx-option__icon', 'consumer-icon');
		await expect(icon).toHaveAttribute('data-qa', 'icon-qa');
	},
};

export const CheckOptionBehavior: Story = {
	render: () => (
		<ul>
			<CheckOption id='checked' selected>
				Checked
			</CheckOption>
			<CheckOption id='unchecked'>Unchecked</CheckOption>
		</ul>
	),
	play: async ({ canvasElement }) => {
		const checked = canvasElement.querySelector('#checked') as HTMLElement;
		await expect(checked).toHaveAttribute('aria-selected', 'true');
		const input = checked.querySelector('input') as HTMLInputElement;
		await expect(input).toBeChecked();
		await expect(input).toHaveAttribute('tabindex', '-1');
		await expect(input).toHaveAttribute('aria-hidden', 'true');
		await expect(canvasElement.querySelector('#unchecked input')).not.toBeChecked();
	},
};

export const Skeleton: Story = {
	render: () => (
		<ul>
			<OptionSkeleton />
		</ul>
	),
	play: async ({ canvasElement }) => {
		await expect(canvasElement.querySelector('li.rcx-option')).toHaveAttribute('aria-hidden', 'true');
	},
};

const EXPECTED_CLASSES = [
	'root > ul > li[0]: rcx-item rcx-item--clickable rcx-item--inset-md rcx-option',
	'root > ul > li[0] > div: rcx-item__content rcx-option__content',
	'root > ul > li[0] > div > div: rcx-item__title',
	'root > ul > li[1]: rcx-item rcx-item--clickable rcx-item--focused rcx-item--inset-md rcx-option rcx-option--focus',
	'root > ul > li[1] > div: rcx-item__content rcx-option__content',
	'root > ul > li[1] > div > div: rcx-item__title',
	'root > ul > li[2]: rcx-item rcx-item--clickable rcx-item--focus-managed rcx-item--focus-visible rcx-item--focused rcx-item--inset-md rcx-option rcx-option--focus',
	'root > ul > li[2] > div: rcx-item__content rcx-option__content',
	'root > ul > li[2] > div > div: rcx-item__title',
	'root > ul > li[3]: rcx-item rcx-item--clickable rcx-item--inset-md rcx-item--selected rcx-option rcx-option--selected',
	'root > ul > li[3] > div: rcx-item__content rcx-option__content',
	'root > ul > li[3] > div > div: rcx-item__title',
	'root > ul > li[4]: rcx-item rcx-item--clickable rcx-item--disabled rcx-item--inset-md rcx-option rcx-option--disabled',
	'root > ul > li[4] > div: rcx-item__content rcx-option__content',
	'root > ul > li[4] > div > div: rcx-item__title',
	'root > ul > li[5]: rcx-item rcx-item--clickable rcx-item--danger rcx-item--inset-md rcx-option rcx-option--danger',
	'root > ul > li[5] > div: rcx-item__content rcx-option__content',
	'root > ul > li[5] > div > div: rcx-item__title',
	'root > ul > li[6]: rcx-item rcx-item--clickable rcx-item--inset-md rcx-option rcx-option--success',
	'root > ul > li[6] > div: rcx-item__content rcx-option__content',
	'root > ul > li[6] > div > div: rcx-item__title',
	'root > ul > li[7]: rcx-item rcx-item--clickable rcx-item--inset-md rcx-option rcx-option--warning',
	'root > ul > li[7] > div: rcx-item__content rcx-option__content',
	'root > ul > li[7] > div > div: rcx-item__title',
	'root > ul > li[8]: rcx-item rcx-item--clickable rcx-item--inset-md rcx-option rcx-option--primary',
	'root > ul > li[8] > div: rcx-item__content rcx-option__content',
	'root > ul > li[8] > div > div: rcx-item__title',
	'root > ul > li[9]: rcx-item rcx-item--align-start rcx-item--clickable rcx-item--inset-md rcx-option rcx-option--align-top',
	'root > ul > li[9] > div: rcx-item__content rcx-option__content',
	'root > ul > li[9] > div > div: rcx-item__title',
	'root > ul > li[10]: rcx-item rcx-item--clickable rcx-item--inset-md rcx-option',
	'root > ul > li[10] > div[0]: rcx-item__media rcx-option__avatar',
	'root > ul > li[10] > div[1]: rcx-item__icon rcx-option__column',
	'root > ul > li[10] > div[1] > i: rcx-box rcx-box--full rcx-icon rcx-icon--name-user rcx-option__icon',
	'root > ul > li[10] > div[2]: rcx-item__icon rcx-option__column',
	'root > ul > li[10] > div[3]: rcx-item__content rcx-option__content',
	'root > ul > li[10] > div[3] > div: rcx-item__title',
].join('\n');

const EXPECTED_ARIA = [
	'- list:',
	'  - listitem [disabled=false] [selected=false]:',
	'    - text: "Plain"',
	'  - listitem [disabled=false] [selected=false]:',
	'    - text: "Focus"',
	'  - listitem [disabled=false] [selected=false]:',
	'    - text: "FocusVisible"',
	'  - listitem [disabled=false] [selected]:',
	'    - text: "Selected"',
	'  - listitem [disabled] [selected=false]:',
	'    - text: "Disabled"',
	'  - listitem [disabled=false] [selected=false]:',
	'    - text: "Danger"',
	'  - listitem [disabled=false] [selected=false]:',
	'    - text: "Success"',
	'  - listitem [disabled=false] [selected=false]:',
	'    - text: "Warning"',
	'  - listitem [disabled=false] [selected=false]:',
	'    - text: "Primary"',
	'  - listitem [disabled=false] [selected=false]:',
	'    - text: "Described"',
	'  - listitem [disabled=false] [selected=false]:',
	'    - text: "A"',
	'    - text: "Rich"',
].join('\n');

export const Variations: Story = {
	render: () => (
		<ul id='variations'>
			<Option label='Plain' />
			<Option label='Focus' focus />
			<Option label='FocusVisible' focus focusVisible />
			<Option label='Selected' selected />
			<Option label='Disabled' disabled />
			<Option label='Danger' variant='danger' />
			<Option label='Success' variant='success' />
			<Option label='Warning' variant='warning' />
			<Option label='Primary' variant='primary' />
			<Option label='Described' description='More' />
			<Option label='Rich' icon='user' avatar='A' gap className={['a', 'b'] as never} />
		</ul>
	),
	play: async ({ canvasElement }) => {
		const rows = [...canvasElement.querySelectorAll('li.rcx-option')];
		await expect(rows).toHaveLength(11);
		await expect(rows[10]).toHaveClass('a', 'b');
		await expect(classContract(canvasElement)).toBe(EXPECTED_CLASSES);
		await expect(ariaSnapshot(canvasElement)).toBe(EXPECTED_ARIA);
	},
};
