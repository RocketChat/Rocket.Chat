import { Box, Skeleton, Margins } from '@rocket.chat/fuselage';
import React, { useEffect, useState } from 'react';

import ZapierWarningDeprecatedPopup from '../../../../components/ZapierWarningDeprecatedPopup/ZapierWarningDeprecatedPopup';

const blogSpotStyleScriptImport = (src) =>
	new Promise((resolve) => {
		const script = document.createElement('script');
		script.type = 'text/javascript';
		document.body.appendChild(script);

		const resolveFunc = (event) => resolve(event.currentTarget);

		script.onreadystatechange = resolveFunc;
		script.onload = resolveFunc;
		script.src = src;
	});

export default function NewZapier({ ...props }) {
	const [script, setScript] = useState();
	useEffect(() => {
		const importZapier = async () => {
			const scriptEl = await blogSpotStyleScriptImport(
				'https://zapier.com/apps/embed/widget.js?services=rocketchat&html_id=zapier-goes-here',
			);
			setScript(scriptEl);
		};
		if (!script) {
			importZapier();
		}
		return () => script && script.parentNode.removeChild(script);
	}, [script]);

	return (
		<>
			<ZapierWarningDeprecatedPopup />
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
}
