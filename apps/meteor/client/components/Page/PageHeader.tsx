import { Box } from '@rocket.chat/fuselage';
import React, { useContext, FC, ReactNode } from 'react';

import { useLayout } from '../../contexts/LayoutContext';
import BurgerMenu from '../BurgerMenu';
import TemplateHeader from '../Header';
import PageContext from './PageContext';

type PageHeaderProps = {
	title: ReactNode;
};

const PageHeader: FC<PageHeaderProps> = ({ children = undefined, title, ...props }) => {
	const [border] = useContext(PageContext);
	const { isMobile } = useLayout();

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
					{title}
				</Box>
				{children}
			</Box>
		</Box>
	);
};

export default PageHeader;
