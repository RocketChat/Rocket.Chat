import { Box, Icon } from '@rocket.chat/fuselage';
import React, { useContext, FC, ReactNode } from 'react';

import { useLayout } from '../../contexts/LayoutContext';
import { useCurrentRoute, useRoute } from '../../contexts/RouterContext';
import BurgerMenu from '../BurgerMenu';
import TemplateHeader from '../Header';
import PageContext from './PageContext';

type PageHeaderProps = {
	title: ReactNode;
	isAppDetails?: boolean;
};

const PageHeader: FC<PageHeaderProps> = ({ children = undefined, title, isAppDetails = false, ...props }) => {
	const [border] = useContext(PageContext);
	const { isMobile } = useLayout();

	const [currentRouteName] = useCurrentRoute();
	if (!currentRouteName) {
		throw new Error('No current route name');
	}

	const router = useRoute(currentRouteName);
	const handleReturn = (): void => router.push({});

	return (
		<Box borderBlockEndWidth='x2' borderBlockEndColor={border ? 'neutral-200' : 'transparent'}>
			<Box
				marginBlock='x16'
				marginInline='x24'
				minHeight='x40'
				display='flex'
				flexDirection='row'
				flexWrap='nowrap'
				alignItems='center'
				color='neutral-800'
				{...props}
			>
				{isMobile && (
					<TemplateHeader.ToolBox>
						<BurgerMenu />
					</TemplateHeader.ToolBox>
				)}
				<Box is='h2' fontScale='h2' flexGrow={1}>
					{isAppDetails && <Icon name='back' style={{ cursor: 'pointer' }} size='x28' mie='x8' onClick={handleReturn} />}
					{title}
				</Box>
				{children}
			</Box>
		</Box>
	);
};

export default PageHeader;
