import type { ILivechatDepartment, IOmnichannelCannedResponse } from '@rocket.chat/core-typings';
import { Button, ButtonGroup } from '@rocket.chat/fuselage';
import {
	ContextualbarHeader,
	ContextualbarTitle,
	ContextualbarAction,
	ContextualbarScrollableContent,
	ContextualbarFooter,
	ContextualbarDialog,
	ContextualbarClose,
	InfoPanel,
	InfoPanelField,
	InfoPanelLabel,
	InfoPanelText,
} from '@rocket.chat/ui-client';
import type { MouseEventHandler } from 'react';
import { memo, useId } from 'react';
import { useTranslation } from 'react-i18next';

import { useScopeDict } from '../../../hooks/useScopeDict';
import CannedResponseTagList from '../../layout/CannedResponseTagList';

export type CannedResponseProps = {
	allowEdit: boolean;
	allowUse: boolean;
	data: {
		departmentName?: ILivechatDepartment['name'];
		shortcut: IOmnichannelCannedResponse['shortcut'];
		text: IOmnichannelCannedResponse['text'];
		scope: IOmnichannelCannedResponse['scope'];
		tags: IOmnichannelCannedResponse['tags'];
	};
	onClickBack: MouseEventHandler<HTMLOrSVGElement>;
	onClickEdit: MouseEventHandler<HTMLOrSVGElement>;
	onClickUse: MouseEventHandler<HTMLOrSVGElement>;
	onClose: () => void;
};

const CannedResponse = ({
	allowEdit,
	allowUse,
	data: { departmentName, shortcut, text, scope: dataScope, tags },
	onClickBack,
	onClickEdit,
	onClickUse,
	onClose,
}: CannedResponseProps) => {
	const { t } = useTranslation();
	const scope = useScopeDict(dataScope, departmentName);
	const tagsLabelId = useId();

	return (
		<ContextualbarDialog>
			<ContextualbarHeader>
				{onClickBack && <ContextualbarAction onClick={onClickBack} title={t('Back_to_canned_responses')} name='arrow-back' />}
				<ContextualbarTitle>!{shortcut}</ContextualbarTitle>
				{onClose && <ContextualbarClose onClick={onClose} />}
			</ContextualbarHeader>
			<ContextualbarScrollableContent>
				<InfoPanel>
					<InfoPanelField>
						<InfoPanelLabel>{t('Shortcut')}</InfoPanelLabel>
						<InfoPanelText>!{shortcut}</InfoPanelText>
					</InfoPanelField>
					<InfoPanelField>
						<InfoPanelLabel>{t('Content')}</InfoPanelLabel>
						<InfoPanelText>&quot;{text}&quot;</InfoPanelText>
					</InfoPanelField>
					<InfoPanelField>
						<InfoPanelLabel>{t('Sharing')}</InfoPanelLabel>
						<InfoPanelText>{scope}</InfoPanelText>
					</InfoPanelField>
					<InfoPanelField>
						<InfoPanelLabel id={tagsLabelId}>{t('Tags')}</InfoPanelLabel>
						<InfoPanelText>
							{tags && tags.length > 0 ? <CannedResponseTagList tags={tags} aria-labelledby={tagsLabelId} /> : '-'}
						</InfoPanelText>
					</InfoPanelField>
				</InfoPanel>
			</ContextualbarScrollableContent>
			<ContextualbarFooter>
				<ButtonGroup stretch>
					{allowEdit && <Button onClick={onClickEdit}>{t('Edit')}</Button>}
					<Button variant='primary' disabled={!allowUse} onClick={onClickUse}>
						{t('Use')}
					</Button>
				</ButtonGroup>
			</ContextualbarFooter>
		</ContextualbarDialog>
	);
};

export default memo(CannedResponse);
