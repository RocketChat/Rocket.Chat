import { Box, Icon, Tooltip } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

const EditingComposerHint = (): ReactElement => {
	const t = useTranslation();
	return (
		<>
			<Box display='flex' flexDirection='row' justifyContent='space-between' alignItems='end'>
				<Tooltip variation='light' fontScale='c2'>
					<Icon name='pencil' size='x16' marginInlineEnd='x5' />
					{t('Editing_Message')}
				</Tooltip>
				<Box color='font-hint'>
					<Box display='inline' fontWeight='c2'>
						esc
					</Box>{' '}
					to {t('Cancel')}
					{' · '}
					<Box display='inline' fontWeight='c2'>
						enter
					</Box>{' '}
					to {t('Save')}
				</Box>
			</Box>
		</>
	);
	// return (
	// 	<>

	// 		<Flex.Container direction='row' justifyContent='space-between'>
	// 			<Flex.Item>
	// 				{/* <Tooltip fontScale='c2'>Editing Message</Tooltip> */}
	// 				<div>Left</div>
	// 			</Flex.Item>
	// 			<Flex.Item>
	// 				{/* <Box color='font-info'>esc to cancel enter to save</Box> */}
	// 				<div>Right</div>
	// 			</Flex.Item>
	// 		</Flex.Container>
	// 	</>
	// );
};

export default EditingComposerHint;
