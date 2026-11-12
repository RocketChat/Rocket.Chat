import { screen } from '@testing-library/react';
import type { ReactElement } from 'react';

import SidebarAccordionItem from './SidebarAccordionItem.js';
import { SidebarBanner } from './SidebarBanner.js';
import { SidebarCollapseGroup } from './SidebarCollapseGroup.js';
import { SidebarFooter } from './SidebarFooter/SidebarFooter.js';
import { SidebarFooterContent } from './SidebarFooter/SidebarFooterContent.js';
import { SidebarSection } from './SidebarSection.js';
import { render } from '../../testing.js';
import OptionAvatar from '../Option/OptionAvatar.js';
import OptionColumn from '../Option/OptionColumn.js';
import OptionDescription from '../Option/OptionDescription.js';
import OptionDescriptionBlock from '../Option/OptionDescriptionBlock.js';
import OptionHeader from '../Option/OptionHeader.js';
import OptionIcon from '../Option/OptionIcon.js';
import OptionInput from '../Option/OptionInput.js';
import OptionTitle from '../Option/OptionTitle.js';

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
