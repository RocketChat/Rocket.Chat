import type { AbacMembershipVerdict, AbacPreviewMember } from '@rocket.chat/core-typings';
import { Box, Divider, Icon } from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import type { ComponentProps } from 'react';

const verdictIcons: Record<AbacMembershipVerdict, Pick<ComponentProps<typeof Icon>, 'name' | 'color'>> = {
	compliant: { name: 'success-circle', color: 'status-font-on-success' },
	nonCompliant: { name: 'error-circle', color: 'status-font-on-danger' },
	inconclusive: { name: 'warning', color: 'status-font-on-warning' },
};

type AbacPreviewMemberGroupProps = {
	title: string;
	members: AbacPreviewMember[];
	verdict: AbacMembershipVerdict;
};

const AbacPreviewMemberGroup = ({ title, members, verdict }: AbacPreviewMemberGroupProps) => {
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
						<Icon
							{...verdictIcons[verdict]}
							size='x16'
							flexShrink={0}
							marginInlineStart={8}
							role='img'
							aria-hidden={false}
							aria-label={title}
							title={title}
						/>
					</Box>
				))}
			</Box>
		</Box>
	);
};

export default AbacPreviewMemberGroup;
