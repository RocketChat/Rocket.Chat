import type { ReactElement } from 'react';

import GenericGroupPage from './GenericGroupPage';
import TabbedGroupPage from './TabbedGroupPage';
import { useEditableSettingsGroupSections, useEditableSettingsGroupTabs } from '../../EditableSettingsContext';

type BaseGroupPageProps = {
	_id: string;
	i18nLabel: string;
	headerButtons?: ReactElement;
	hasReset?: boolean;
	onClickBack?: () => void;
};
const BaseGroupPage = ({ _id, i18nLabel, headerButtons, hasReset, onClickBack, ...props }: BaseGroupPageProps) => {
	const tabs = useEditableSettingsGroupTabs(_id);
	const sections = useEditableSettingsGroupSections(_id);

	if (tabs.length > 1) {
		return (
			<TabbedGroupPage _id={_id} i18nLabel={i18nLabel} headerButtons={headerButtons} tabs={tabs} onClickBack={onClickBack} {...props} />
		);
	}

	return <GenericGroupPage _id={_id} i18nLabel={i18nLabel} sections={sections} onClickBack={onClickBack} hasReset={hasReset} {...props} />;
};

export default BaseGroupPage;
