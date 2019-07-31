import React from 'react';

import { AdminUserInformationStep } from './steps/AdminUserInformationStep';
import { SettingsBasedStep } from './steps/SettingsBasedStep';
import { RegisterServerStep } from './steps/RegisterServerStep';
import { useTranslation } from '../../hooks/useTranslation';
import { SideBar } from './SideBar';

const Container = (props) => <section className='setup-wizard-forms' {...props} />;

const Wrapper = (props) => <div className='setup-wizard-forms__wrapper' {...props} />;

export function Steps() {
	const t = useTranslation();

	return <>
		<SideBar
			steps={[
				{
					step: 1,
					title: t('Admin_Info'),
				},
				{
					step: 2,
					title: t('Organization_Info'),
				},
				{
					step: 3,
					title: t('Server_Info'),
				},
				{
					step: 4,
					title: t('Register_Server'),
				},
			]}
		/>
		<Container>
			<Wrapper>
				<AdminUserInformationStep step={1} title={t('Admin_Info')} />
				<SettingsBasedStep step={2} title={t('Organization_Info')} />
				<SettingsBasedStep step={3} title={t('Server_Info')} />
				<RegisterServerStep step={4} title={t('Register_Server')} />
			</Wrapper>
		</Container>
	</>;
}
