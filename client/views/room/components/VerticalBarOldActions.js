import React from 'react';

import VerticalBar from '../../../components/VerticalBar';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useTabBarClose } from '../providers/ToolboxProvider';
import { BlazeTemplate } from './BlazeTemplate';

export default ({ name, icon, tabBar, title, ...props }) => {
	const close = useTabBarClose();
	const t = useTranslation();

	return <> <VerticalBar.Header>
		<VerticalBar.Icon name={icon}/>
		<VerticalBar.Text>{ t(title) }</VerticalBar.Text>
		{close && <VerticalBar.Close onClick={close}/>}
	</VerticalBar.Header>

	<VerticalBar.ScrollableContent>
		<BlazeTemplate name={name} tabBar={tabBar} {...props} />
	</VerticalBar.ScrollableContent>
	</>;
};
