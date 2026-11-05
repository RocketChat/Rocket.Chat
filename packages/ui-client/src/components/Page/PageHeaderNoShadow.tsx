import { Box, IconButton } from '@rocket.chat/fuselage';
import { useLayout } from '@rocket.chat/ui-contexts';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { useDocumentTitle } from '../../hooks/index.js';
import { HeaderToolbar } from '../Header/index.js';
import { SidebarToggler } from '../SidebarToggler/index.js';

type PageHeaderProps = {
	title: ReactNode;
	onClickBack?: () => void;
	borderBlockEndColor?: string;
} & Omit<ComponentPropsWithoutRef<typeof Box>, 'title'>;

const PageHeaderNoShadow = ({ children = undefined, title, onClickBack, ...props }: PageHeaderProps) => {
	const { t } = useTranslation();
	const { sidebar, isEmbedded } = useLayout();

	useDocumentTitle(typeof title === 'string' ? title : undefined);

	return (
		<Box is='header' borderBlockEndWidth='default' paddingBlock={8} borderBlockEndColor='transparent' {...props}>
			<Box
				height='100%'
				marginInline={24}
				minHeight='x64'
				display='flex'
				flexDirection='row'
				flexWrap='wrap'
				alignItems='center'
				columnGap={8}
				color='default'
			>
				{sidebar.shouldToggle && isEmbedded ? (
					<HeaderToolbar>
						<SidebarToggler />
					</HeaderToolbar>
				) : null}
				{onClickBack && <IconButton size='small' icon='arrow-back' onClick={onClickBack} title={t('Back')} />}
				<Box is='h1' fontScale='h2' flexGrow={1}>
					{title}
				</Box>
				{children}
			</Box>
		</Box>
	);
};

export default PageHeaderNoShadow;
