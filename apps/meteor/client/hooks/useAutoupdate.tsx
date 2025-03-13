import { css } from '@rocket.chat/css-in-js';
import { Box, Button } from '@rocket.chat/fuselage';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

export const useAutoupdate = () => {
	const toast = useToastMessageDispatch();

	useEffect(() => {
		const fn = () => {
			toast({
				type: 'info',
				title: 'Update available',
				message: (
					<Box
						display='flex'
						flexDirection='column'
						className={css`
							gap: 8px;
						`}
					>
						An update is available
						<Button small onClick={() => window.location.reload()}>
							Reload to update
						</Button>
					</Box>
				),
				options: { position: 'bottom-end', isPersistent: true },
			});
		};
		document.addEventListener('client_changed', fn);

		return () => {
			document.removeEventListener('client_changed', fn);
		};
	}, [toast]);
};
