import { css } from '@rocket.chat/css-in-js';
import { Box, Option, IconButton } from '@rocket.chat/fuselage';
import { useTranslation, useEndpoint } from '@rocket.chat/ui-contexts';
import { useMutation, useQueryClient } from '@tanstack/react-query';

type MatrixFederationRemoveServerListProps = {
	servers: Array<{ name: string; default: boolean; local: boolean }>;
};

const style = css`
	i {
		visibility: hidden;
	}
	li {
		cursor: default;
	}
	li:hover {
		i {
			cursor: pointer;
			visibility: visible;
		}
	}
`;

const MatrixFederationRemoveServerList = ({ servers }: MatrixFederationRemoveServerListProps) => {
	const removeMatrixServer = useEndpoint('POST', '/v1/federation/removeServerByUser');

	const queryClient = useQueryClient();

	const { mutate: removeServer, isPending: isRemovingServer } = useMutation({
		mutationKey: ['federation/removeServerByUser'],
		mutationFn: (serverName: string) => removeMatrixServer({ serverName }),

		onSuccess: () =>
			queryClient.invalidateQueries({
				queryKey: ['federation/listServersByUsers'],
			}),
	});

	const t = useTranslation();

	return (
		<Box display='flex' flexDirection='column' className={[style]}>
			<Box is='h2' fontScale='p1' fontWeight='bolder'>
				{t('Servers')}
			</Box>
			{servers.map(({ name, default: isDefault }) => (
				<Option key={name} title={name} label={name}>
					{!isDefault && (
						<IconButton
							icon='cross'
							tiny
							danger={!isRemovingServer}
							disabled={isRemovingServer}
							aria-label={t('Remove')}
							onClick={() => removeServer(name)}
						/>
					)}
				</Option>
			))}
		</Box>
	);
};

export default MatrixFederationRemoveServerList;
