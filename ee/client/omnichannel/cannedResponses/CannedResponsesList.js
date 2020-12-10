import React from 'react';
import { Box, Margins } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { clickableItem } from '../../../../client/lib/clickableItem';

const CannedResponseItem = clickableItem(({ shortcut, text, scope, _id, onDetails, className }) => {
	const t = useTranslation();

	const handleDetails = useMutableCallback(() => {
		onDetails(_id);
	});

	return <Box
		w='full'
		display='flex'
		flexDirection='column'
		p='x8'
		pi='x24'
		onClick={handleDetails}
		className={className}
		mb='neg-x4'
	>
		<Margins block='x4'>
			<Box display='flex' flexDirection='row' justifyContent='space-between'>
				<Box display='flex' flexDirection='column'>
					<Box fontScale='p2'>{t('Shortcut')}:</Box>
					<Box fontScale='p1' withTruncatedText>!{shortcut}</Box>
				</Box>
				{/* <Button onClick={onUse}>{t('Use_response')}</Button> TODO: Disable button on department context */}
			</Box>

			<span>
				<Box fontScale='p2'>{t('Content')}:</Box>
				<Box mbe='x2' withTruncatedText>{text}</Box>
			</span>

			<span>
				<Box fontScale='p2'>{t('Scope')}:</Box>
				<Box mbs='x2'>{scope}</Box>
			</span>
		</Margins>
	</Box>;
});

const CannedResponsesList = ({ responses, onDetails }) => <>
	{responses && responses.map((response) => <CannedResponseItem key={response._id} onDetails={onDetails} {...response}/>)}
</>;

export default React.memo(CannedResponsesList);
