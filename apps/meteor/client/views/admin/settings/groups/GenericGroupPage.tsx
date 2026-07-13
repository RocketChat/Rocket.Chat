import type { TranslationKey } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { getSettingsSectionAnchorId } from './getSettingsSectionAnchorId';
import SettingsGroupPage from '../SettingsGroupPage';
import Section from '../SettingsSection';

export type GenericGroupPageProps = {
	_id: string;
	i18nLabel: string;
	tabs?: ReactNode;
	currentTab?: string;
	hasReset?: boolean;
	sections: string[];
	headerButtons?: ReactNode;
	onClickBack?: () => void;
};

function GenericGroupPage({ _id, i18nLabel, sections, tabs, currentTab, hasReset, onClickBack, ...props }: GenericGroupPageProps) {
	const { t } = useTranslation();

	const navItems = useMemo(
		() =>
			sections
				.filter(Boolean)
				.map((sectionName) => ({ id: getSettingsSectionAnchorId(_id, sectionName), label: t(sectionName as TranslationKey) })),
		[sections, _id, t],
	);

	return (
		<SettingsGroupPage _id={_id} i18nLabel={i18nLabel} onClickBack={onClickBack} tabs={tabs} navItems={navItems} {...props}>
			{sections.map((sectionName) => (
				<Section
					key={sectionName || ''}
					id={getSettingsSectionAnchorId(_id, sectionName)}
					hasReset={hasReset}
					groupId={_id}
					sectionName={sectionName}
					currentTab={currentTab}
				/>
			))}
		</SettingsGroupPage>
	);
}

export default memo(GenericGroupPage);
