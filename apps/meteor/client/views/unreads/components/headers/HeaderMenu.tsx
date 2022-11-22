import { Sidebar, Dropdown, OptionDivider, OptionTitle, Option, RadioButton } from '@rocket.chat/fuselage';
import { useLayout, useTranslation } from '@rocket.chat/ui-contexts';
import React, { VFC, useRef, HTMLAttributes } from 'react';
import { createPortal } from 'react-dom';

import ListItem from '../../../../components/Sidebar/ListItem';
import { useDropdownVisibility } from '../../../../sidebar/header/hooks/useDropdownVisibility';

type HeaderMenuProps = Omit<HTMLAttributes<HTMLElement>, 'is'> & {
	handleMarkAll: () => Promise<void>;
	sortBy: string;
	setSortBy: (sortBy: string) => void;
	hasUndo?: boolean;
};

const HeaderMenu: VFC<HeaderMenuProps> = (props) => {
	const { handleMarkAll, sortBy, setSortBy, hasUndo, ...rest } = props;
	const t = useTranslation();
	const { isMobile } = useLayout();

	const reference = useRef(null);
	const target = useRef(null);
	const { isVisible, toggle } = useDropdownVisibility({ reference, target });

	const [checked, setChecked] = React.useState(sortBy === 'Activity');

	const sortUnreadMessages = (): void => {
		if (checked) {
			setChecked(false);
			setSortBy('Name');
		} else {
			setChecked(true);
			setSortBy('Activity');
		}
	};

	return (
		<Sidebar.TopBar.Section className='sidebar--custom-colors'>
			<Sidebar.TopBar.Action icon='sort' {...rest} onClick={(): void => toggle()} ref={reference} />
			{isVisible &&
				createPortal(
					<Dropdown reference={reference} ref={target}>
						{isMobile && (
							<>
								<OptionTitle>{t('Action')}</OptionTitle>
								<Option
									label={hasUndo ? t('Undo_all') : t('Mark_all_as_read_short')}
									icon={hasUndo ? 'undo' : 'flag'}
									onClick={handleMarkAll}
								/>
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
		</Sidebar.TopBar.Section>
	);
};

export default HeaderMenu;
