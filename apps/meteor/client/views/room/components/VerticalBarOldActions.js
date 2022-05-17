import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import VerticalBar from '../../../components/VerticalBar';
import { useTabBarClose } from '../providers/ToolboxProvider';
import BlazeTemplate from './BlazeTemplate';

const VerticalBarOldActions = ({ name, icon, tabBar, title, ...props }) => {
	const close = useTabBarClose();
	const t = useTranslation();

	return (
		<>
			{' '}
			<VerticalBar.Header>
				<VerticalBar.Icon name={icon} />
				<VerticalBar.Text>{t(title)}</VerticalBar.Text>
				{close && <VerticalBar.Close onClick={close} />}
			</VerticalBar.Header>
			<VerticalBar.Content>
				<BlazeTemplate flexShrink={1} overflow='hidden' name={name} tabBar={tabBar} {...props} />
			</VerticalBar.Content>
		</>
	);
};

export default VerticalBarOldActions;
