import React from 'react';
import { Box, Button, Margins } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { clickableItem } from '../../../../client/lib/clickableItem';

const CannedMessageItem = clickableItem(({ shortcut, text, scope, _id, onUse, onDetails, className }) => {
	const t = useTranslation();

	const handleDetails = useMutableCallback(() => {
		onDetails(_id);
	});

	return <Box
		w='full'
		display='flex'
		flexDirection='column'
		p='x8'
		onClick={handleDetails}
		className={className}
		mb='neg-x4'
	>
		<Margins block='x4'>
			<Box display='flex' flexDirection='row' justifyContent='space-between'>
				<Box display='flex' flexDirection='column'>
					<Box fontScale='p2'>{t('Shortcut')}:</Box>
					<Box fontScale='p1'>!{shortcut}</Box>
				</Box>
				<Button onClick={onUse}>{t('Use_response')}</Button>
			</Box>

			<span>
				<Box fontScale='p2'>{t('Content')}:</Box>
				<Box mbe='x2'>{text}</Box>
			</span>

			<span>
				<Box fontScale='p2'>{t('Scope')}:</Box>
				<Box mbs='x2'>{scope}</Box>
			</span>
		</Margins>
	</Box>;
});

const CannedResponsesList = ({ responses }) => <>
	{responses && responses.map((response) => <CannedMessageItem {...response}/>)}
</>;

export default React.memo(CannedResponsesList);
