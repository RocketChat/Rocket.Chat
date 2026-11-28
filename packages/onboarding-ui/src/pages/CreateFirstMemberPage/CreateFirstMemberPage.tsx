import { BackgroundLayer } from '@rocket.chat/layout';

import TitleCreateFirstMemberPage from './TitleCreateFirstMemberPage.js';
import type { FormPageLayoutStyleProps } from '../../Types/index.js';
import FormPageLayout from '../../common/FormPageLayout.js';
import CreateFirstMemberForm, { type CreateFirstMemberFormProps } from '../../forms/CreateFirstMemberForm/index.js';

export type CreateFirstMemberPageProps = CreateFirstMemberFormProps;

const CreateFirstMemberPage = (props: CreateFirstMemberPageProps) => {
	const pageLayoutStyleProps: FormPageLayoutStyleProps = {
		justifyContent: 'center',
	};

	return (
		<BackgroundLayer>
			<FormPageLayout title={<TitleCreateFirstMemberPage />} styleProps={pageLayoutStyleProps}>
				<CreateFirstMemberForm {...props} />
			</FormPageLayout>
		</BackgroundLayer>
	);
};

export default CreateFirstMemberPage;
