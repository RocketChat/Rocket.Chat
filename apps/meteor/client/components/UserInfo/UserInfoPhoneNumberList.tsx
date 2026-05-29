import type { IUserPhoneNumber } from '@rocket.chat/core-typings';
import { Box, Tag } from '@rocket.chat/fuselage';

import { formatPhoneNumber } from '../../lib/formatPhoneNumber';

const UserInfoPhoneNumberList = ({ phones }: { phones: IUserPhoneNumber[] }) => (
	<Box is='ul' display='flex' flexDirection='column' gap={4}>
		{phones.map((p, index) => (
			<Box is='li' key={`${p.number}${p.label}${index}`} display='flex' flexDirection='row' alignItems='center'>
				<Box is='a' withTruncatedText href={`tel:${p.number}`}>
					<span>{formatPhoneNumber(p.number)}</span>
					{p.label && (
						<Tag mis={4} display='inline-flex'>
							{p.label}
						</Tag>
					)}
				</Box>
			</Box>
		))}
	</Box>
);

export default UserInfoPhoneNumberList;
