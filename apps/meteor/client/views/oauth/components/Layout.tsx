import { Box } from '@rocket.chat/fuselage';
import { VerticalWizardLayout } from '@rocket.chat/layout';
import { useAssetWithDarkModePath, useSetting } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';

type LayoutProps = {
	children?: ReactNode;
};

const Layout = ({ children }: LayoutProps) => {
	const hideLogo = useSetting('Layout_Login_Hide_Logo', false);
	const customLogo = useAssetWithDarkModePath('logo');
	const customBackground = useAssetWithDarkModePath('background');

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
