import { useRouter } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';

import EditableSettingsProvider from '../settings/EditableSettingsProvider';
import GenericGroupPage from '../settings/groups/GenericGroupPage';

type AISettingsSectionName = 'Intelligent_Search' | 'AI_LLM_Provider';

const AISettingsSection = ({ section }: { section: AISettingsSectionName }): ReactElement => {
	const router = useRouter();
	const title = section === 'Intelligent_Search' ? 'Intelligent_Search' : 'AI_Center_LLM_Providers';

	return (
		<EditableSettingsProvider>
			<GenericGroupPage _id='AI_Center' i18nLabel={title} sections={[section]} onClickBack={() => router.navigate('/admin/ai-center')} />
		</EditableSettingsProvider>
	);
};

export default AISettingsSection;
