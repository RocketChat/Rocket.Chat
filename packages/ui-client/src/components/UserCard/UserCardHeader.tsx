import { Box, Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

import UserCardUsername from './UserCardUsername';

export type UserCardHeaderProps = {
	avatar?: ReactNode;
	name?: string;
	status: ReactNode;
	nickname?: string;
	subtitle?: ReactNode;
};

const UserCardHeader = ({ avatar, name, status, nickname, subtitle }: UserCardHeaderProps) => (
	<Item>
		{avatar && <ItemMedia>{avatar}</ItemMedia>}
		<ItemContent>
			<ItemTitle>
				<Box display='flex' alignItems='center' withTruncatedText>
					<UserCardUsername is='h2' flexGrow={0} flexBasis='auto' status={status} name={name} />
					{nickname && (
						<Box flexShrink={1} title={nickname} color='hint' marginInlineStart='x4' fontScale='p1' withTruncatedText>
							({nickname})
						</Box>
					)}
				</Box>
			</ItemTitle>
			{subtitle && <ItemDescription size='large'>{subtitle}</ItemDescription>}
		</ItemContent>
	</Item>
);

export default UserCardHeader;
