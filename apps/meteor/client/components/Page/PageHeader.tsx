import { Box, IconButton } from '@rocket.chat/fuselage';
import { HeaderToolbox } from '@rocket.chat/ui-client';
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
			is='header'
			borderBlockEndWidth='default'
			minHeight='x64'
			pb={8}
			borderBlockEndColor={borderBlockEndColor ?? border ? 'extra-light' : 'transparent'}
			{...props}
		>
			<Box height='100%' marginInline={24} display='flex' flexDirection='row' flexWrap='wrap' alignItems='center' color='default'>
				{isMobile && (
					<HeaderToolbox>
						<BurgerMenu />
					</HeaderToolbox>
				)}
				{onClickBack && <IconButton small mie={8} icon='arrow-back' onClick={onClickBack} title={t('Back')} />}
				<Box is='h1' fontScale='h2' flexGrow={1} id='PageHeader-title' data-qa-type='PageHeader-title'>
					{title}
				</Box>
				{children}
			</Box>
		</Box>
	);
};

export default PageHeader;
