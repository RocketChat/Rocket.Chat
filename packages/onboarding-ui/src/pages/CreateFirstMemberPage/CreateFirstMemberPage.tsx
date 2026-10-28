import { BackgroundLayer } from '@rocket.chat/layout';
import type { ComponentProps } from 'react';

import TitleCreateFirstMemberPage from './TitleCreateFirstMemberPage';
import type { FormPageLayoutStyleProps } from '../../Types';
import FormPageLayout from '../../common/FormPageLayout';
import CreateFirstMemberForm from '../../forms/CreateFirstMemberForm';

export type CreateFirstMemberPageProps = ComponentProps<typeof CreateFirstMemberForm>;

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
