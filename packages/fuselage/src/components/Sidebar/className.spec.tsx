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

const cases: [string, ReactElement, string][] = [
	['SidebarSection', <SidebarSection data-testid='part' className='custom' />, 'rcx-sidebar-section'],
	['SidebarFooter', <SidebarFooter data-testid='part' className='custom' />, 'rcx-sidebar-footer'],
	['SidebarFooterContent', <SidebarFooterContent data-testid='part' className='custom' />, 'rcx-sidebar-footer__content'],
	['SidebarBanner', <SidebarBanner data-testid='part' className='custom' variant='info' />, 'rcx-sidebar-banner--info'],
	['SidebarCollapseGroup', <SidebarCollapseGroup data-testid='part' className='custom' title='Group' />, 'rcx-sidebar-collapse-group'],
	['SidebarAccordionItem', <SidebarAccordionItem data-testid='part' className='custom' title='Item' />, 'rcx-sidebar-accordion-item'],
	['OptionAvatar', <OptionAvatar data-testid='part' className='custom' />, 'rcx-option__avatar'],
	['OptionColumn', <OptionColumn data-testid='part' className='custom' />, 'rcx-option__column'],
	['OptionDescription', <OptionDescription data-testid='part' className='custom' />, 'rcx-option__description'],
	['OptionDescriptionBlock', <OptionDescriptionBlock data-testid='part' className='custom' />, 'rcx-option__description-block'],
	['OptionInput', <OptionInput data-testid='part' className='custom' />, 'rcx-option__input'],
	[
		'OptionHeader',
		<OptionHeader data-testid='part' className='custom'>
			Group
		</OptionHeader>,
		'rcx-option__header',
	],
	[
		'OptionTitle',
		<OptionTitle data-testid='part' className='custom'>
			Title
		</OptionTitle>,
		'rcx-option__title',
	],
	['OptionIcon', <OptionIcon data-testid='part' className='custom' name='bell' />, 'rcx-option__icon'],
];

describe('consumer className on Sidebar and Option parts', () => {
	it.each(cases)('%s keeps its own class next to the consumer one', (_name, element, ownClass) => {
		render(element);

		expect(screen.getByTestId('part')).toHaveClass(ownClass, 'custom');
	});
});
