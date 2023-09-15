import { Box } from '@rocket.chat/fuselage';
import {
	HorizontalWizardLayout,
	HorizontalWizardLayoutAside,
	HorizontalWizardLayoutContent,
	// HorizontalWizardLayoutTitle,
	// HorizontalWizardLayoutFooter,
	// HorizontalWizardLayoutDescription,
} from '@rocket.chat/layout';
import { useSetting, useAssetWithDarkModePath } from '@rocket.chat/ui-contexts';
import type { ReactElement, ReactNode } from 'react';

// import LoginPoweredBy from '../components/LoginPoweredBy';
// import LoginSwitchLanguageFooter from '../components/LoginSwitchLanguageFooter';
// import LoginTerms from '../components/LoginTerms';
// import { RegisterTitle } from '../components/RegisterTitle';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';


const HorizontalTemplate = ({ children }: { children: ReactNode }): ReactElement => {
	const hideLogo = useSetting<boolean>('Layout_Login_Hide_Logo');
	const customLogo = useAssetWithDarkModePath('logo');
	const customBackground = useAssetWithDarkModePath('background');


	const getOrgLogoList = useEndpoint('GET', '/v1/orgDetail.list');
	const resultData: any = useQuery(['orgLogo'], () => getOrgLogoList(), {
		keepPreviousData: true,
	});

	const title = resultData?.data?.orgLogo[0].ibInfo;
	const finalLogo = resultData?.data?.orgLogo[0].logoUrl;

	// console.log('resultData sidebar -->', finalLogo);

	return (
		<HorizontalWizardLayout
			background={customBackground}
			logo={!hideLogo && customLogo ? <Box is='img' maxHeight='x40' mi='neg-x8' src={finalLogo} alt='Logo' /> : <></>}
		>
			<HorizontalWizardLayoutAside>
				{/* <HorizontalWizardLayoutTitle>
					<RegisterTitle />
				</HorizontalWizardLayoutTitle> */}
				{/* <HorizontalWizardLayoutDescription>
					<LoginPoweredBy />
				</HorizontalWizardLayoutDescription> */}
				<Box is='h1' pbs={32}><h2>{title}</h2></Box>
			</HorizontalWizardLayoutAside>
			<HorizontalWizardLayoutContent>
				{children}
				{/* <HorizontalWizardLayoutFooter>
					<LoginTerms />
					<LoginSwitchLanguageFooter />
				</HorizontalWizardLayoutFooter> */}
			</HorizontalWizardLayoutContent>
		</HorizontalWizardLayout>
	);
};

export default HorizontalTemplate;
