import { css } from '@rocket.chat/css-in-js';
import { Box, Option, Icon } from '@rocket.chat/fuselage';
import { useTranslation, useEndpoint } from '@rocket.chat/ui-contexts';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { VFC } from 'react';
import React from 'react';

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

const MatrixFederationRemoveServerList: VFC<MatrixFederationRemoveServerListProps> = ({ servers }) => {
	const removeMatrixServer = useEndpoint('POST', '/v1/federation/removeServerByUser');

	const queryClient = useQueryClient();

	const { mutate: removeServer, isLoading: isRemovingServer } = useMutation(
		['federation/removeServerByUser'],
		(serverName: string) => removeMatrixServer({ serverName }),
		{ onSuccess: () => queryClient.invalidateQueries(['federation/listServersByUsers']) },
	);

	const t = useTranslation();

	return (
		<Box display='flex' flexDirection='column' className={[style]}>
			<Box is='h2' fontScale='p1' fontWeight='bolder'>
				{t('Servers')}
			</Box>
			{servers.map(({ name, default: isDefault }) => (
				<Option key={name} title={name} label={name}>
					{!isDefault && (
						<Icon
							size='x16'
							color={isRemovingServer ? 'annotation' : 'danger'}
							name='cross'
							onClick={() => (isRemovingServer ? null : removeServer(name))}
						/>
					)}
				</Option>
			))}
		</Box>
	);
};

export default MatrixFederationRemoveServerList;
