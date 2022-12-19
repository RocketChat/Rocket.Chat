import { Box, IconButton } from '@rocket.chat/fuselage';
import { Header as TemplateHeader } from '@rocket.chat/ui-client';
import { useLayout, useTranslation } from '@rocket.chat/ui-contexts';
import type { FC, ComponentProps, ReactNode } from 'react';
import React, { useContext } from 'react';

import BurgerMenu from '../BurgerMenu';
import PageContext from './PageContext';

type PageHeaderProps = {
	title: ReactNode;
	onClickBack?: () => void;
	borderBlockEndColor?: string;
} & Omit<ComponentProps<typeof Box>, 'title'>;

const PageHeader: FC<PageHeaderProps> = ({ children = undefined, title, onClickBack, borderBlockEndColor, ...props }) => {
	const t = useTranslation();
	const [border] = useContext(PageContext);
	const { isMobile } = useLayout();

	return (
		<Box
			borderBlockEndWidth='x2'
			minHeight='x64'
			borderBlockEndColor={borderBlockEndColor ?? border ? 'extra-light' : 'transparent'}
			{...props}
		>
			<Box
				marginBlock='x8'
				marginInline='x24'
				display='flex'
				flexDirection='row'
				flexWrap='nowrap'
				alignItems='center'
				color='default'
				{...props}
			>
				{isMobile && (
					<TemplateHeader.ToolBox>
						<BurgerMenu />
					</TemplateHeader.ToolBox>
				)}
				{onClickBack && <IconButton small mie='x8' icon='arrow-back' onClick={onClickBack} title={t('Back')} />}
				<Box is='h1' fontScale='h2' flexGrow={1} id='PageHeader-title' data-qa-type='PageHeader-title'>
					{title}
				</Box>
				{children}
			</Box>
		</Box>
	);
};

export default PageHeader;
