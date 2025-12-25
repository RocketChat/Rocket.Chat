import '@rocket.chat/ui-contexts';

declare module '@rocket.chat/ui-contexts' {
	interface IRouterPaths {
		'setup-wizard': {
			pathname: `/setup-wizard${`/${string}` | ''}`;
			pattern: '/setup-wizard/:step?';
		};
	}
}
