import { Box, IconButton, Skeleton } from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

const VoipContactId = ({
	name,
	username,
	transferedBy,
	isLoading = false,
}: {
	name?: string;
	username?: string;
	transferedBy?: string;
	isLoading?: boolean;
}) => {
	const dispatchToastMessage = useToastMessageDispatch();
	const { t } = useTranslation();

	const handleCopy = useMutation({
		mutationFn: (contactName: string) => navigator.clipboard.writeText(contactName),
		onSuccess: () => dispatchToastMessage({ type: 'success', message: t('Phone_number_copied') }),
		onError: () => dispatchToastMessage({ type: 'error', message: t('Failed_to_copy_phone_number') }),
	});

	if (!name) {
		return null;
	}

	if (isLoading) {
		return (
			<Box display='flex' pi={12} pb={8}>
				<Skeleton variant='rect' size={20} mie={8} />
				<Skeleton variant='text' width={100} height={16} />
			</Box>
		);
	}

	return (
		<Box pi={12} pbs={4} pbe={8}>
			{transferedBy && (
				<Box mbe={8} fontScale='p2' color='secondary-info'>
					{t('From')}: {transferedBy}
				</Box>
			)}

			<Box display='flex'>
				{username && (
					<Box flexShrink={0} mie={8}>
						<UserAvatar username={username} size='x24' />
					</Box>
				)}

				<Box withTruncatedText is='p' fontScale='p1' mie='auto' color='secondary-info' flexGrow={1} flexShrink={1} title={name}>
					{name}
				</Box>

				{!username && (
					<IconButton
						mini
						aria-label={t('Copy_phone_number')}
						data-tooltip={t('Copy_phone_number')}
						mis={6}
						icon='copy'
						onClick={() => handleCopy.mutate(name)}
					/>
				)}
			</Box>
		</Box>
	);
};

export default VoipContactId;
