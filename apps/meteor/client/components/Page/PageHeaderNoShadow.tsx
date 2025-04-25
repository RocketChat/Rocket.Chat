import { Box, IconButton } from '@rocket.chat/fuselage';
import { useDocumentTitle, FeaturePreview, FeaturePreviewOn, FeaturePreviewOff } from '@rocket.chat/ui-client';
import { useLayout } from '@rocket.chat/ui-contexts';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { HeaderToolbar } from '../Header';
import { SidebarTogglerV2 } from '../SidebarTogglerV2';

type PageHeaderProps = {
	title: ReactNode;
	onClickBack?: () => void;
	borderBlockEndColor?: string;
} & Omit<ComponentPropsWithoutRef<typeof Box>, 'title'>;

const PageHeaderNoShadow = ({ children = undefined, title, onClickBack, ...props }: PageHeaderProps) => {
	const { t } = useTranslation();

	const { isMobile } = useLayout();

	useDocumentTitle(typeof title === 'string' ? title : undefined);

	return (
		<Box is='header' borderBlockEndWidth='default' pb={8} borderBlockEndColor='transparent' {...props}>
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
					<FeaturePreview feature='newNavigation'>
						<FeaturePreviewOff>
							<HeaderToolbar>
								<SidebarTogglerV2 />
							</HeaderToolbar>
						</FeaturePreviewOff>
						<FeaturePreviewOn>{null}</FeaturePreviewOn>
					</FeaturePreview>
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

export default PageHeaderNoShadow;
