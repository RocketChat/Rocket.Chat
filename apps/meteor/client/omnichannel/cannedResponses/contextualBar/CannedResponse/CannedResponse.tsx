import type { ILivechatDepartment, IOmnichannelCannedResponse } from '@rocket.chat/core-typings';
import { Box, Button, ButtonGroup, Tag } from '@rocket.chat/fuselage';
import type { MouseEventHandler } from 'react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import {
	ContextualbarHeader,
	ContextualbarTitle,
	ContextualbarAction,
	ContextualbarContent,
	ContextualbarFooter,
	ContextualbarDialog,
	ContextualbarClose,
} from '../../../../components/Contextualbar';
import { useScopeDict } from '../../../hooks/useScopeDict';

type CannedResponseProps = {
	allowEdit: boolean;
	allowUse: boolean;
	data: {
		departmentName: ILivechatDepartment['name'];
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

	return (
		<ContextualbarDialog>
			<ContextualbarHeader>
				{onClickBack && <ContextualbarAction onClick={onClickBack} title={t('Back_to_canned_responses')} name='arrow-back' />}
				<ContextualbarTitle>!{shortcut}</ContextualbarTitle>
				{onClose && <ContextualbarClose onClick={onClose} />}
			</ContextualbarHeader>
			<ContextualbarContent>
				<Box pb='24px'>
					<Box mbe='16px'>
						<Box fontScale='p2m' mbe='8px'>
							{t('Shortcut')}:
						</Box>
						<Box fontScale='c1' color='hint'>
							!{shortcut}
						</Box>
					</Box>
					<Box mbe='16px'>
						<Box fontScale='p2m' mbe='8px'>
							{t('Content')}:
						</Box>
						<Box fontScale='c1' color='hint'>
							"{text}"
						</Box>
					</Box>
					<Box mbe='16px'>
						<Box fontScale='p2m' mbe='8px'>
							{t('Sharing')}:
						</Box>
						<Box fontScale='c1' color='hint'>
							{scope}
						</Box>
					</Box>
					<Box mbe='16px'>
						<Box fontScale='p2m' mbe='8px'>
							{t('Tags')}:
						</Box>
						<Box display='flex' flexDirection='row'>
							{tags && tags.length > 0 ? (
								<Box display='flex' w='full' flexDirection='row' mbs='8px' flexWrap='wrap'>
									{tags.map((tag: string, idx: number) => (
										<Box key={idx} mie='4px' mbe='4px'>
											<Tag>{tag}</Tag>
										</Box>
									))}
								</Box>
							) : (
								'-'
							)}
						</Box>
					</Box>
				</Box>
			</ContextualbarContent>
			<ContextualbarFooter>
				<ButtonGroup stretch>
					{allowEdit && <Button onClick={onClickEdit}>{t('Edit')}</Button>}
					<Button primary disabled={!allowUse} onClick={onClickUse}>
						{t('Use')}
					</Button>
				</ButtonGroup>
			</ContextualbarFooter>
		</ContextualbarDialog>
	);
};

export default memo(CannedResponse);
