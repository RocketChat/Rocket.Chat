import { Box, Button, ButtonGroup, Tag } from '@rocket.chat/fuselage';
import React, { FC, memo, MouseEventHandler } from 'react';

import VerticalBar from '../../../../../../client/components/VerticalBar';
import { useTranslation } from '../../../../../../client/contexts/TranslationContext';

const CannedResponse: FC<{
	canEdit: boolean;
	data: { shortcut: string; text: string; scope: string; tags: any };
	onClickBack: MouseEventHandler<HTMLOrSVGElement>;
	onClickEdit: MouseEventHandler<HTMLOrSVGElement>;
	onClickUse: MouseEventHandler<HTMLOrSVGElement>;
}> = ({ canEdit, data: { shortcut, text, scope, tags }, onClickBack, onClickEdit, onClickUse }) => {
	const t = useTranslation();

	return (
		<VerticalBar
			display='flex'
			flexDirection='column'
			width={'full'}
			overflow='hidden'
			zIndex={100}
			insetBlock={0}
		>
			<VerticalBar.Header>
				{onClickBack && (
					<VerticalBar.Action
						onClick={onClickBack}
						title={t('Back_to_threads')}
						name='arrow-back'
					/>
				)}
				<VerticalBar.Text>!{shortcut}</VerticalBar.Text>
			</VerticalBar.Header>
			<VerticalBar.Content>
				<Box pb='24px'>
					<Box mbe='16px'>
						<Box fontScale='p2' mbe='8px'>
							{t('Shortcut')}:
						</Box>
						<Box fontScale='c1' color='info'>
							!{shortcut}
						</Box>
					</Box>
					<Box mbe='16px'>
						<Box fontScale='p2' mbe='8px'>
							{t('Content')}:
						</Box>
						<Box fontScale='c1' color='info'>
							"{text}"
						</Box>
					</Box>
					<Box mbe='16px'>
						<Box fontScale='p2' mbe='8px'>
							{t('Sharing')}:
						</Box>
						<Box fontScale='c1' color='info'>
							{scope}
						</Box>
					</Box>
					<Box mbe='16px'>
						<Box fontScale='p2' mbe='8px'>
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
			</VerticalBar.Content>
			<VerticalBar.Footer>
				<ButtonGroup stretch>
					{canEdit && <Button onClick={onClickEdit}>{t('Edit')}</Button>}
					<Button primary onClick={onClickUse}>
						{t('Use')}
					</Button>
				</ButtonGroup>
			</VerticalBar.Footer>
		</VerticalBar>
	);
};

export default memo(CannedResponse);
