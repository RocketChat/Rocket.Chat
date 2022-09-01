import type { ReactElement } from 'react';

export const LoginPoweredBy = (): ReactElement => (
	<div className='powered-by'>
		Powered by{' '}
		<a className='color-tertiary-font-color' href='https://rocket.chat'>
			Open Source Chat Platform Rocket.Chat
		</a>
		.
	</div>
);

export default LoginPoweredBy;
