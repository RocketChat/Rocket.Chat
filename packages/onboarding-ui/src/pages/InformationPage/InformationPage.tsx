import { HeroLayout, HeroLayoutSubtitle, HeroLayoutTitle } from '@rocket.chat/layout';
import type { ReactNode } from 'react';

export type InformationPageProps = {
	title: string;
	description?: ReactNode;
};

const InformationPage = ({ title, description }: InformationPageProps) => (
	<HeroLayout>
		<HeroLayoutTitle>{title}</HeroLayoutTitle>
		{description && <HeroLayoutSubtitle>{description}</HeroLayoutSubtitle>}
	</HeroLayout>
);

export default InformationPage;
