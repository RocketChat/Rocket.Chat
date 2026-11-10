import { BackgroundLayer } from '@rocket.chat/layout';

import TitleCreateFirstMemberPage from './TitleCreateFirstMemberPage';
import type { FormPageLayoutStyleProps } from '../../Types';
import FormPageLayout from '../../common/FormPageLayout';
import CreateFirstMemberForm, { type CreateFirstMemberFormProps } from '../../forms/CreateFirstMemberForm';

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
