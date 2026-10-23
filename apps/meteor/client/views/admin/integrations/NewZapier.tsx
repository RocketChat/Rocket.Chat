import { Box, Skeleton, Callout } from '@rocket.chat/fuselage';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useOAuthAppQuery } from '../../oauth/hooks/useOAuthAppQuery';
import PageLoading from '../../root/PageLoading';

const blogSpotStyleScriptImport = (src: string) =>
	new Promise((resolve) => {
		const script = document.createElement('script');
		script.type = 'text/javascript';
		document.body.appendChild(script);

		const resolveFunc = (event: Event) => resolve(event.currentTarget);

		script.addEventListener('readystatechange', (event) => resolveFunc(event));
		script.addEventListener('load', (event) => resolveFunc(event));
		script.src = src;
	});

const NewZapier = ({ ...props }) => {
	const { t } = useTranslation();
	const oauthAppQuery = useOAuthAppQuery('zapier');
	const zapierAvailable = !oauthAppQuery.isLoading && !oauthAppQuery.isError && oauthAppQuery.data;
	const [script, setScript] = useState<HTMLScriptElement>();

	useEffect(() => {
		const importZapier = async () => {
			const scriptEl = await blogSpotStyleScriptImport(
				'https://zapier.com/apps/embed/widget.js?services=rocketchat&html_id=zapier-goes-here',
			);

			setScript(scriptEl as HTMLScriptElement);
		};

		if (!script && zapierAvailable) {
			importZapier();
		}

		return () => {
			if (script) {
				script.parentNode?.removeChild(script);
			}
		};
	}, [script, zapierAvailable]);

	if (oauthAppQuery.isLoading) {
		return <PageLoading />;
	}

	return (
		<Box display='flex' flexDirection='column' gap={4} paddingBlockStart={16}>
			<Callout
				type='warning'
				icon='warning'
				title={t(!zapierAvailable ? 'Zapier_integration_is_not_available' : 'Zapier_integration_has_been_deprecated')}
			>
				{t(!zapierAvailable ? 'Install_Zapier_from_marketplace_new_workspaces' : 'Install_Zapier_from_marketplace')}
			</Callout>
			{zapierAvailable && (
				<Box>
					{!script && (
						<Box display='flex' flexDirection='column' alignItems='stretch' marginBlockStart='x8' gap='x12' paddingBlockEnd='x12'>
							<Skeleton variant='rect' height={71} />
							<Skeleton variant='rect' height={71} />
							<Skeleton variant='rect' height={71} />
							<Skeleton variant='rect' height={71} />
							<Skeleton variant='rect' height={71} />
						</Box>
					)}
					<Box id='zapier-goes-here' {...props} />
				</Box>
			)}
		</Box>
	);
};

export default NewZapier;
