import { screen } from '@testing-library/react';
import type { ReactElement } from 'react';

import SidebarAccordionItem from './SidebarAccordionItem';
import { SidebarBanner } from './SidebarBanner';
import { SidebarCollapseGroup } from './SidebarCollapseGroup';
import { SidebarFooter } from './SidebarFooter/SidebarFooter';
import { SidebarFooterContent } from './SidebarFooter/SidebarFooterContent';
import { SidebarSection } from './SidebarSection';
import { render } from '../../testing';
import OptionAvatar from '../Option/OptionAvatar';
import OptionColumn from '../Option/OptionColumn';
import OptionDescription from '../Option/OptionDescription';
import OptionDescriptionBlock from '../Option/OptionDescriptionBlock';
import OptionHeader from '../Option/OptionHeader';
import OptionIcon from '../Option/OptionIcon';
import OptionInput from '../Option/OptionInput';
import OptionTitle from '../Option/OptionTitle';

const cases: { name: string; element: ReactElement; ownClass: string }[] = [
	{ name: 'SidebarSection', element: <SidebarSection data-testid='part' className='custom' />, ownClass: 'rcx-sidebar-section' },
	{ name: 'SidebarFooter', element: <SidebarFooter data-testid='part' className='custom' />, ownClass: 'rcx-sidebar-footer' },
	{
		name: 'SidebarFooterContent',
		element: <SidebarFooterContent data-testid='part' className='custom' />,
		ownClass: 'rcx-sidebar-footer__content',
	},
	{
		name: 'SidebarBanner',
		element: <SidebarBanner data-testid='part' className='custom' variant='info' />,
		ownClass: 'rcx-sidebar-banner--info',
	},
	{
		name: 'SidebarCollapseGroup',
		element: <SidebarCollapseGroup data-testid='part' className='custom' title='Group' />,
		ownClass: 'rcx-sidebar-collapse-group',
	},
	{
		name: 'SidebarAccordionItem',
		element: <SidebarAccordionItem data-testid='part' className='custom' title='Item' />,
		ownClass: 'rcx-sidebar-accordion-item',
	},
	{ name: 'OptionAvatar', element: <OptionAvatar data-testid='part' className='custom' />, ownClass: 'rcx-option__avatar' },
	{ name: 'OptionColumn', element: <OptionColumn data-testid='part' className='custom' />, ownClass: 'rcx-option__column' },
	{ name: 'OptionDescription', element: <OptionDescription data-testid='part' className='custom' />, ownClass: 'rcx-option__description' },
	{
		name: 'OptionDescriptionBlock',
		element: <OptionDescriptionBlock data-testid='part' className='custom' />,
		ownClass: 'rcx-option__description-block',
	},
	{ name: 'OptionInput', element: <OptionInput data-testid='part' className='custom' />, ownClass: 'rcx-option__input' },
	{
		name: 'OptionHeader',
		element: (
			<OptionHeader data-testid='part' className='custom'>
				Group
			</OptionHeader>
		),
		ownClass: 'rcx-option__header',
	},
	{
		name: 'OptionTitle',
		element: (
			<OptionTitle data-testid='part' className='custom'>
				Title
			</OptionTitle>
		),
		ownClass: 'rcx-option__title',
	},
	{ name: 'OptionIcon', element: <OptionIcon data-testid='part' className='custom' name='bell' />, ownClass: 'rcx-option__icon' },
];

describe('consumer className on Sidebar and Option parts', () => {
	it.each(cases)('$name keeps its own class next to the consumer one', ({ element, ownClass }) => {
		render(element);

		expect(screen.getByTestId('part')).toHaveClass(ownClass, 'custom');
	});
});
