import { Box } from '@rocket.chat/fuselage';
import type { MouseEvent } from 'react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export type SettingsSectionNavItem = {
	id: string;
	label: string;
};

type SettingsSectionNavProps = {
	groupLabel: string;
	items: SettingsSectionNavItem[];
};

const SettingsSectionNav = ({ groupLabel, items }: SettingsSectionNavProps) => {
	const { t } = useTranslation();
	const [activeId, setActiveId] = useState(items[0]?.id);

	useEffect(() => {
		setActiveId((current) => (items.some((item) => item.id === current) ? current : items[0]?.id));
	}, [items]);

	const handleClick = (event: MouseEvent<HTMLAnchorElement>, id: string): void => {
		event.preventDefault();
		setActiveId(id);
		document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	};

	return (
		<Box
			is='nav'
			width='x240'
			flexShrink={0}
			pi={24}
			pbs={24}
			display='flex'
			flexDirection='column'
			overflowY='auto'
			borderInlineStartWidth='default'
			borderInlineStartColor='light'
		>
			<Box is='h3' mbe={16} color='hint' fontScale='micro' textTransform='uppercase'>
				{t('Settings_in_group', { group: groupLabel })}
			</Box>
			{items.map(({ id, label }) => {
				const isActive = id === activeId;
				return (
					<Box
						key={id}
						is='a'
						href={`#${id}`}
						onClick={(event: MouseEvent<HTMLAnchorElement>) => handleClick(event, id)}
						pb={8}
						pis={12}
						mbe={4}
						fontScale='p2'
						color={isActive ? 'info' : 'hint'}
						fontWeight={isActive ? 700 : 400}
						style={{ cursor: 'pointer', textDecoration: 'none' }}
					>
						{label}
					</Box>
				);
			})}
		</Box>
	);
};

export default SettingsSectionNav;
