import { Box, Skeleton, Margins, Callout } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { useEffect, useState } from 'react';

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
	const t = useTranslation();
	const [script, setScript] = useState<HTMLScriptElement>();

	useEffect(() => {
		const importZapier = async () => {
			const scriptEl = await blogSpotStyleScriptImport(
				'https://zapier.com/apps/embed/widget.js?services=rocketchat&html_id=zapier-goes-here',
			);

			setScript(scriptEl as HTMLScriptElement);
		};

		if (!script) {
			importZapier();
		}

		return () => {
			if (script) {
				script.parentNode?.removeChild(script);
			}
		};
	}, [script]);

	return (
		<>
			<Callout type='warning' icon='warning' title={t('Zapier_integration_has_been_deprecated')} mbs={16} mbe={4}>
				{t('Install_Zapier_from_marketplace')}
			</Callout>
			{!script && (
				<Box display='flex' flexDirection='column' alignItems='stretch' mbs={10}>
					<Margins blockEnd={14}>
						<Skeleton variant='rect' height={71} />
						<Skeleton variant='rect' height={71} />
						<Skeleton variant='rect' height={71} />
						<Skeleton variant='rect' height={71} />
						<Skeleton variant='rect' height={71} />
					</Margins>
				</Box>
			)}
			<Box id='zapier-goes-here' {...props} />
		</>
	);
};

export default NewZapier;
