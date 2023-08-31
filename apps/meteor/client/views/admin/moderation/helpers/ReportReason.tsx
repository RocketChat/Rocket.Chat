import { Box, Tag } from '@rocket.chat/fuselage';
import React from 'react';

import { useFormatDate } from '../../../../hooks/useFormatDate';

const ReportReason = ({ ind, uinfo, msg, ts }: { ind: number; uinfo: string | undefined; msg: string; ts: Date }): JSX.Element => {
	const formatDate = useFormatDate();
	return (
		<Box display='flex' flexDirection='column' alignItems='flex-start' marginBlock={10}>
			<Tag variant='danger'>Report #{ind}</Tag>
			<Box marginBlock={5} fontSize='p2b'>
				{msg}
			</Box>
			<Box>
				<Box is='span' fontWeight='700' color='font-info' fontSize='micro'>
					@{uinfo || 'rocket.cat'}
				</Box>{' '}
				<Box is='span' fontWeight='700' color='font-annotation' fontSize='micro'>
					{formatDate(ts)}
				</Box>
			</Box>
		</Box>
	);
};

export default ReportReason;
