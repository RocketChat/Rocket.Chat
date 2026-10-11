import { BackgroundLayer } from '@rocket.chat/layout';
import type { ReactNode } from 'react';

import type { FormPageLayoutStyleProps } from '../../Types';
import FormPageLayout from '../../common/FormPageLayout';
import AwaitingConfirmationForm from '../../forms/AwaitConfirmationForm';

export type AwaitingConfirmationPageProps = {
	title?: ReactNode;
	description?: ReactNode;
	currentStep: number;
	stepCount: number;
	emailAddress: string;
	securityCode: string;
	onResendEmailRequest: () => void;
	onChangeEmailRequest: () => void;
};

const pageLayoutStyleProps: FormPageLayoutStyleProps = {
	justifyContent: 'center',
};

const AwaitingConfirmationPage = ({
	title,
	description,
	currentStep,
	stepCount,
	securityCode,
	emailAddress,
	onResendEmailRequest,
	onChangeEmailRequest,
}: AwaitingConfirmationPageProps) => (
	<BackgroundLayer>
		<FormPageLayout title={title} styleProps={pageLayoutStyleProps} description={description}>
			<AwaitingConfirmationForm
				currentStep={currentStep}
				stepCount={stepCount}
				securityCode={securityCode}
				emailAddress={emailAddress}
				onResendEmailRequest={onResendEmailRequest}
				onChangeEmailRequest={onChangeEmailRequest}
			/>
		</FormPageLayout>
	</BackgroundLayer>
);
export default AwaitingConfirmationPage;
