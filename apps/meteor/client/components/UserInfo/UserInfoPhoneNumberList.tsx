import type { IUserPhoneNumber } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';

import { formatPhoneNumber } from '../../lib/formatPhoneNumber';

const UserInfoPhoneNumberList = ({ phones }: { phones: IUserPhoneNumber[] }) => (
	<Box is='ul' display='flex' flexDirection='column' gap={4}>
		{phones.map((p, index) => (
			<Box is='li' key={`${p.number}${p.label}${index}`} display='flex' flexDirection='row' alignItems='center'>
				<Box is='a' withTruncatedText href={`tel:${p.number}`} style={{ textDecoration: 'none' }}>
					<span style={{ textDecoration: 'underline' }}>{formatPhoneNumber(p.number)}</span>
					{p.label && (
						<Box mis={4} fontScale='p2' color='hint' is='span' withTruncatedText>
							({p.label})
						</Box>
					)}
				</Box>
			</Box>
		))}
	</Box>
);

export default UserInfoPhoneNumberList;
