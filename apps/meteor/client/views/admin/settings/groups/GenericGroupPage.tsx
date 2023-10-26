import type { ISetting } from '@rocket.chat/core-typings';
import type { ReactElement } from 'react';
import React, { memo } from 'react';

import { useEditableSettingsGroupSections } from '../../EditableSettingsContext';
import GroupPage from '../GroupPage';
import Section from '../Section';

type GenericGroupPageProps = ISetting;

function GenericGroupPage({ _id, ...props }: GenericGroupPageProps): ReactElement {
	const sections = useEditableSettingsGroupSections(_id);
	const solo = sections.length === 1;

	return (
		<GroupPage _id={_id} {...props}>
			{sections.map((sectionName) => (
				<Section key={sectionName || ''} groupId={_id} sectionName={sectionName} solo={solo} />
			))}
		</GroupPage>
	);
}

export default memo(GenericGroupPage);
