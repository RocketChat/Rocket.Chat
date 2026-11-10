import type { SelectOption } from '@rocket.chat/fuselage';
import { BackgroundLayer } from '@rocket.chat/layout';
import type { ReactNode } from 'react';
import type { SubmitHandler } from 'react-hook-form';

import type { FormPageLayoutStyleProps } from '../../Types';
import FormPageLayout from '../../common/FormPageLayout';
import OrganizationInfoForm from '../../forms/OrganizationInfoForm';
import type { OrganizationInfoPayload } from '../../forms/OrganizationInfoForm/OrganizationInfoForm';

export type OrganizationInfoPageProps = {
	title?: ReactNode;
	subtitle?: ReactNode;
	description?: ReactNode;
	currentStep: number;
	stepCount: number;
	organizationIndustryOptions: SelectOption[];
	organizationSizeOptions: SelectOption[];
	countryOptions: SelectOption[];
	initialValues?: OrganizationInfoPayload;
	nextStep?: ReactNode;
	onSubmit: SubmitHandler<OrganizationInfoPayload>;
	onBackButtonClick?: () => void;
	onClickSkip?: () => void;
};

const OrganizationInfoPage = ({ title, description, ...props }: OrganizationInfoPageProps) => {
	const pageLayoutStyleProps: FormPageLayoutStyleProps = {
		justifyContent: 'center',
		subTitleProps: {
			fontWeight: '400',
		},
	};

	return (
		<BackgroundLayer>
			<FormPageLayout styleProps={pageLayoutStyleProps} title={title} description={description}>
				<OrganizationInfoForm {...props} />
			</FormPageLayout>
		</BackgroundLayer>
	);
};

export default OrganizationInfoPage;
