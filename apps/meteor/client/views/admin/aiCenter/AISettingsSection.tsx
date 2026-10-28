import { useRouter } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';

import EditableSettingsProvider from '../settings/EditableSettingsProvider';
import GenericGroupPage from '../settings/groups/GenericGroupPage';

export type AISettingsSectionName = 'Intelligent_Search' | 'AI_LLM_Provider' | 'MCP';

export type AISettingsSectionProps = {
	section: AISettingsSectionName;
};

const sectionTitles: Record<AISettingsSectionName, string> = {
	Intelligent_Search: 'Intelligent_Search',
	AI_LLM_Provider: 'AI_Center_LLM_Providers',
	MCP: 'MCP',
};

const AISettingsSection = ({ section }: AISettingsSectionProps): ReactElement => {
	const router = useRouter();
	const title = sectionTitles[section];

	return (
		<EditableSettingsProvider>
			<GenericGroupPage _id='AI_Center' i18nLabel={title} sections={[section]} onClickBack={() => router.navigate('/admin/ai-center')} />
		</EditableSettingsProvider>
	);
};

export default AISettingsSection;
