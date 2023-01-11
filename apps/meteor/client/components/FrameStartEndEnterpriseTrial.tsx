import { Box, Button } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

function FrameStartEndEnterpriseTrial() {
	const t = useTranslation();

	return (
		<>
			<Box display='flex' flexDirection='column' wrap='wrap' alignItems='center'>
				<Box display='flex' flexDirection='row' wrap='wrap' m='x8' is='h1' fontScale='h1' color='default'>
					{/* TODO: fix translations */}
					{t('Experience')}
					<Box is='h1' fontScale='h1' color='primary' mis='x8'>
						{t('Enterprise Edition')}
					</Box>
				</Box>

				<Box is='span' fontScale='p2' color='default' m='x4'>
					{t('Supercharge your workspace with these exclusive Enterprise Edition capabilities.')}
				</Box>

				<Box is='span' fontScale='p2b' color='primary' m='x16'>
					{t('Try now for 30 days')}
				</Box>

				<Button
					m='x16'
					primary
					type='button'
					// TODO: change action
					onClick={() => {
						console.log('click');
					}}
				>
					{t('Start free trial')}
				</Button>
			</Box>
		</>
	);
}

export default FrameStartEndEnterpriseTrial;
