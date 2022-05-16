import React, { useMemo, ReactElement } from 'react';

import { ICustomField } from '../../../definition/ICustomField';
import { ILivechatCustomField } from '../../../definition/ILivechatCustomField';
import CustomFieldsFormAssembler from '../CustomFieldsFormAssembler';

type OmnichannelCustomFieldsFormProps = {
	customFields: ILivechatCustomField[];
	register: unknown;
	errors: unknown;
};

const normalizeCustomFields = (customFields: ILivechatCustomField[]): ICustomField[] =>
	customFields.map((customField) => ({
		...customField,
		type: 'text',
	}));

const OmnichannelCustomFieldsForm = ({ customFields, register, errors }: OmnichannelCustomFieldsFormProps): ReactElement => {
	const customFieldsFieldsList = useMemo(() => normalizeCustomFields(customFields), [customFields]);
	return <CustomFieldsFormAssembler customFields={customFieldsFieldsList} register={register} errors={errors} />;
};

export default OmnichannelCustomFieldsForm;
