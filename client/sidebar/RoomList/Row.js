import { Sidebar } from '@rocket.chat/fuselage';
import React, { memo } from 'react';

import Omnichannel from '../sections/Omnichannel';
import SideBarItemTemplateWithData from './SideBarItemTemplateWithData';

const sections = {
	Omnichannel,
};

const Row = ({ data, item }) => {
	const { extended, t, SideBarItemTemplate, AvatarTemplate, openedRoom, sidebarViewMode } = data;

	if (typeof item === 'string') {
		const Section = sections[item];
		return Section ? (
			<Section aria-level='1' />
		) : (
			<Sidebar.Section.Title aria-level='1'>{t(item)}</Sidebar.Section.Title>
		);
	}
	return (
		<SideBarItemTemplateWithData
			sidebarViewMode={sidebarViewMode}
			selected={item.rid === openedRoom}
			t={t}
			room={item}
			extended={extended}
			SideBarItemTemplate={SideBarItemTemplate}
			AvatarTemplate={AvatarTemplate}
		/>
	);
};

export default memo(Row);
