import type { AbacPreviewMember } from '@rocket.chat/core-typings';
import { Box, Divider, Icon } from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';

type AbacPreviewMemberGroupProps = {
	title: string;
	members: AbacPreviewMember[];
	compliant?: boolean;
};

const AbacPreviewMemberGroup = ({ title, members, compliant = false }: AbacPreviewMemberGroupProps) => {
	if (!members.length) {
		return null;
	}

	return (
		<Box is='section' aria-label={title} marginBlockEnd={16}>
			<Box display='flex' justifyContent='space-between' fontScale='c2' color='hint'>
				<span>{title}</span>
				<span>{members.length}</span>
			</Box>
			<Divider marginBlock={8} />
			<Box is='ul'>
				{members.map(({ _id, username, name }) => (
					<Box is='li' key={_id} display='flex' alignItems='center' paddingBlock={4}>
						{username && <UserAvatar username={username} size='x20' />}
						<Box flexGrow={1} withTruncatedText marginInlineStart={8}>
							<Box is='span' fontScale='p2m' color='default'>
								{name || username}
							</Box>
							{name && username && (
								<Box is='span' fontScale='p2' color='hint' marginInlineStart={4}>
									@{username}
								</Box>
							)}
						</Box>
						{compliant && <Icon name='success-circle' size='x16' color='status-font-on-success' />}
					</Box>
				))}
			</Box>
		</Box>
	);
};

export default AbacPreviewMemberGroup;
