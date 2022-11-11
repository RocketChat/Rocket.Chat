import { Sidebar, Dropdown, OptionDivider, OptionTitle, Option, RadioButton } from '@rocket.chat/fuselage';
import { useEndpoint, useLayout, useTranslation } from '@rocket.chat/ui-contexts';
import React, { VFC, useRef, HTMLAttributes } from 'react';
import { createPortal } from 'react-dom';

import ListItem from '../../../../components/Sidebar/ListItem';
import { useDropdownVisibility } from '../../../../sidebar/header/hooks/useDropdownVisibility';

const HeaderMenu: VFC<Omit<HTMLAttributes<HTMLElement>, 'is'>> = (props) => {
	const readMessages = useEndpoint('POST', '/v1/subscriptions.read');
	const t = useTranslation();
	const { isMobile } = useLayout();

	const reference = useRef(null);
	const target = useRef(null);
	const { isVisible, toggle } = useDropdownVisibility({ reference, target });

	const [checked, setChecked] = React.useState(false);

	const sortUnreadMessages = (): void => {
		if (checked) {
			setChecked(false);
			console.log('Sort by Date');
		} else {
			setChecked(true);
			// rooms.sort((a, b) => a.localeCompare(b));
		}
	};

	return (
		<>
			<Sidebar.TopBar.Action {...props} icon='sort' onClick={(): void => toggle()} ref={reference} />
			{isVisible &&
				createPortal(
					<Dropdown reference={reference} ref={target}>
						{isMobile && (
							<>
								<OptionTitle>{t('Action')}</OptionTitle>
								<Option label={t('Mark_all_as_read_short')} icon={'flag'} onClick={readMessages as any} />
								<OptionDivider />
							</>
						)}
						<OptionTitle>{t('Sort_By')}</OptionTitle>
						<ul>
							<ListItem
								icon={'clock'}
								text={t('Activity')}
								input={<RadioButton pis='x24' name='sidebarSortby' onChange={sortUnreadMessages} checked={checked} />}
							/>
							<ListItem
								icon={'sort-az'}
								text={t('Name')}
								input={<RadioButton pis='x24' name='sidebarSortby' onChange={sortUnreadMessages} checked={!checked} />}
							/>
						</ul>
					</Dropdown>,
					document.body,
				)}
		</>
	);
};

export default HeaderMenu;
