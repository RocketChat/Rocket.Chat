import { Box } from '@rocket.chat/fuselage';
import { BackgroundLayer } from '@rocket.chat/layout';
import type { ComponentProps } from 'react';
import { useTranslation, Trans } from 'react-i18next';

import Description from './Description';
import TitleCreateCloudPage from './TitleCreateCloudPage';
import FormPageLayout from '../../common/FormPageLayout';
import CreateCloudWorkspaceForm from '../../forms/CreateCloudWorkspaceForm';

export type CreateCloudWorkspacePageProps = ComponentProps<typeof CreateCloudWorkspaceForm>;

const CreateCloudWorkspacePage = (props: CreateCloudWorkspacePageProps) => {
	const { t } = useTranslation();

	return (
		<BackgroundLayer>
			<FormPageLayout title={<TitleCreateCloudPage />} description={<Description />} subtitle={t('page.createCloudWorkspace.tryGold')}>
				<CreateCloudWorkspaceForm {...props} />

				<Box marginBlockStart={28} display='inline' textAlign='center'>
					<Trans i18nKey='page.alreadyHaveAccount'>
						Already have an account?
						<Box
							is='a'
							color='primary-400'
							textDecorationLine='none'
							href='https://cloud.rocket.chat/login'
							target='_blank'
							rel='noopener noreferrer'
						>
							Manage your workspaces.
						</Box>
					</Trans>
				</Box>
			</FormPageLayout>
		</BackgroundLayer>
	);
};

export default CreateCloudWorkspacePage;
