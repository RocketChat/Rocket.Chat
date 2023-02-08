import { Field, Margins } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import AutoCompleteAgent from '../../../../../../client/components/AutoCompleteAgent';
import VisitorAutoComplete from '../../../../audit/VisitorAutoComplete';

type VisitorsTabProps = {
	errors: Record<string, string>;
	visitor: string;
	handleVisitor: (visitor: string) => void;
	agent: string;
	handleAgent: (agent: string) => void;
};

const VisitorsTab = ({ errors, visitor, handleVisitor, agent, handleAgent }: VisitorsTabProps): ReactElement => {
	const t = useTranslation();

	return (
		<Margins inline='x4'>
			<Field>
				<Field.Label flexGrow={0}>{t('Visitor')}</Field.Label>
				<Field.Row>
					<VisitorAutoComplete error={errors.visitor} value={visitor} onChange={handleVisitor} placeholder={t('Username_Placeholder')} />
				</Field.Row>
				{errors.visitor && <Field.Error>{errors.visitor}</Field.Error>}
			</Field>
			<Field>
				<Field.Label flexGrow={0}>{t('Agent')}</Field.Label>
				<Field.Row>
					<AutoCompleteAgent
						// error={errors.agent}
						value={agent}
						onChange={handleAgent}
						// placeholder={t('Username_Placeholder')}
					/>
				</Field.Row>
				{errors.agent && <Field.Error>{errors.agent}</Field.Error>}
			</Field>
		</Margins>
	);
};

export default VisitorsTab;
