import { Box } from '@rocket.chat/fuselage';
import { VerticalWizardLayout } from '@rocket.chat/layout';
import { useAssetPath, useSetting } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import React from 'react';

type LayoutProps = {
	children?: ReactNode;
};

const Layout = ({ children }: LayoutProps) => {
	const hideLogo = useSetting<boolean>('Layout_Login_Hide_Logo');
	const customLogo = useAssetPath('Assets_logo');
	const customBackground = useAssetPath('Assets_background');

	return (
		<VerticalWizardLayout
			background={customBackground}
			logo={!hideLogo && customLogo ? <Box is='img' maxHeight={40} mi={-8} src={customLogo} alt='Logo' /> : undefined}
		>
			{children}
		</VerticalWizardLayout>
	);
};

export default Layout;
