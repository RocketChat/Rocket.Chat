import type { ReactElement, ReactNode } from 'react';
import React, { memo } from 'react';

import GroupPage from '../SettingsGroupPage/SettingsGroupPage';
import Section from '../SettingsSection/SettingsSection';

type GenericGroupPageProps = {
	_id: string;
	i18nLabel: string;
	tabs?: ReactNode;
	currentTab?: string;
	hasReset?: boolean;
	sections: string[];
	headerButtons?: ReactNode;
	onClickBack?: () => void;
};

function GenericGroupPage({
	_id,
	i18nLabel,
	sections,
	tabs,
	currentTab,
	hasReset,
	onClickBack,
	...props
}: GenericGroupPageProps): ReactElement {
	const solo = sections.length === 1;

	return (
		<GroupPage _id={_id} i18nLabel={i18nLabel} onClickBack={onClickBack} tabs={tabs} {...props}>
			{sections.map((sectionName) => (
				<Section key={sectionName || ''} hasReset={hasReset} groupId={_id} sectionName={sectionName} currentTab={currentTab} solo={solo} />
			))}
		</GroupPage>
	);
}

export default memo(GenericGroupPage);
