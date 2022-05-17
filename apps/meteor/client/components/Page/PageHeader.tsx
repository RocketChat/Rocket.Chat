import { Box, Icon, ActionButton } from '@rocket.chat/fuselage';
import { useLayout, useTranslation, useCurrentRoute, useRoute } from '@rocket.chat/ui-contexts';
import React, { useContext, FC, ReactNode } from 'react';

import BurgerMenu from '../BurgerMenu';
import TemplateHeader from '../Header';
import PageContext from './PageContext';

type PageHeaderProps = {
	title: ReactNode;
	isAppDetails?: boolean;
	onClickBack?: () => void;
	borderBlockEndColor?: string;
};

const PageHeader: FC<PageHeaderProps> = ({ children = undefined, title, isAppDetails, onClickBack, borderBlockEndColor, ...props }) => {
	const t = useTranslation();
	const [border] = useContext(PageContext);
	const { isMobile } = useLayout();

	const [currentRouteName] = useCurrentRoute();
	if (!currentRouteName) {
		throw new Error('No current route name');
	}

	const router = useRoute(currentRouteName);
	const handleReturn = (): void => router.push({});

	return (
		<Box borderBlockEndWidth='x2' borderBlockEndColor={borderBlockEndColor ?? border ? 'neutral-200' : 'transparent'}>
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
				{onClickBack && <ActionButton ghost small mie='x8' icon='arrow-back' onClick={onClickBack} title={t('Back')} />}
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
