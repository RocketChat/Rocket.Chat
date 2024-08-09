import { Box, IconButton } from '@rocket.chat/fuselage';
import { useDocumentTitle } from '@rocket.chat/ui-client';
import { useLayout, useTranslation } from '@rocket.chat/ui-contexts';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import React, { useContext } from 'react';

import { HeaderToolbar } from '../Header';
import SidebarToggler from '../SidebarToggler';
import PageContext from './PageContext';

type PageHeaderProps = {
	title: ReactNode;
	onClickBack?: () => void;
	borderBlockEndColor?: string;
} & Omit<ComponentPropsWithoutRef<typeof Box>, 'title'>;

const PageHeader = ({ children = undefined, title, onClickBack, borderBlockEndColor, ...props }: PageHeaderProps) => {
	const t = useTranslation();
	const [border] = useContext(PageContext);
	const { isMobile } = useLayout();

	useDocumentTitle(typeof title === 'string' ? title : undefined);

	return (
		<Box
			is='header'
			borderBlockEndWidth='default'
			pb={8}
			borderBlockEndColor={borderBlockEndColor ?? border ? 'extra-light' : 'transparent'}
			{...props}
		>
			<Box
				height='100%'
				marginInline={24}
				minHeight='x64'
				display='flex'
				flexDirection='row'
				flexWrap='wrap'
				alignItems='center'
				color='default'
			>
				{isMobile && (
					<HeaderToolbar>
						<SidebarToggler />
					</HeaderToolbar>
				)}
				{onClickBack && <IconButton small mie={8} icon='arrow-back' onClick={onClickBack} title={t('Back')} />}
				<Box is='h1' fontScale='h2' flexGrow={1} data-qa-type='PageHeader-title'>
					{title}
				</Box>
				{children}
			</Box>
		</Box>
	);
};

export default PageHeader;
