import _ from 'underscore';

RocketChat.API.v1.addRoute('info', { authRequired: false }, {
	get() {
		const user = this.getLoggedInUser();

		if (user && RocketChat.authz.hasRole(user._id, 'admin')) {
			return RocketChat.API.v1.success({
				info: RocketChat.Info
			});
		}

		return RocketChat.API.v1.success({
			info: {
				'version': RocketChat.Info.version
			}
		});
	}
});

RocketChat.API.v1.addRoute('me', { authRequired: true }, {
	get() {
		const me = _.pick(this.user, [
			'_id',
			'name',
			'emails',
			'status',
			'statusConnection',
			'username',
			'utcOffset',
			'active',
			'language'
		]);

		me.avatarUrl = RocketChat.getURL(`/avatar/${ me.username }`, { cdn: false, full: true });

		const verifiedEmail = me.emails.find((email) => email.verified);

		me.email = verifiedEmail ? verifiedEmail.address : undefined;

		return RocketChat.API.v1.success(me);
	}
});

let onlineCache = 0;
let onlineCacheDate = 0;
const cacheInvalid = 60000; // 1 minute
RocketChat.API.v1.addRoute('shield.svg', { authRequired: false }, {
	get() {
		const { type, channel, name, icon } = this.queryParams;
		if (!RocketChat.settings.get('API_Enable_Shields')) {
			throw new Meteor.Error('error-endpoint-disabled', 'This endpoint is disabled', { route: '/api/v1/shields.svg' });
		}
		const types = RocketChat.settings.get('API_Shield_Types');
		if (type && (types !== '*' && !types.split(',').map((t) => t.trim()).includes(type))) {
			throw new Meteor.Error('error-shield-disabled', 'This shield type is disabled', { route: '/api/v1/shields.svg' });
		}
		const hideIcon = icon === 'false';
		if (hideIcon && (!name || !name.trim())) {
			return RocketChat.API.v1.failure('Name cannot be empty when icon is hidden');
		}
		let text;
		switch (type) {
			case 'online':
				if (Date.now() - onlineCacheDate > cacheInvalid) {
					onlineCache = RocketChat.models.Users.findUsersNotOffline().count();
					onlineCacheDate = Date.now();
				}
				text = `${ onlineCache } ${ TAPi18n.__('Online') }`;
				break;
			case 'channel':
				if (!channel) {
					return RocketChat.API.v1.failure('Shield channel is required for type "channel"');
				}
				text = `#${ channel }`;
				break;
			default:
				text = TAPi18n.__('Join_Chat').toUpperCase();
		}
		const iconSize = hideIcon ? 7 : 24;
		const leftSize = name ? name.length * 6 + 7 + iconSize : iconSize;
		const rightSize = text.length * 6 + 20;
		const width = leftSize + rightSize;
		const height = 20;
		return {
			headers: { 'Content-Type': 'image/svg+xml;charset=utf-8' },
			body: `
				<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${ width }" height="${ height }">
				  <linearGradient id="b" x2="0" y2="100%">
				    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
				    <stop offset="1" stop-opacity=".1"/>
				  </linearGradient>
				  <mask id="a">
				    <rect width="${ width }" height="${ height }" rx="3" fill="#fff"/>
				  </mask>
				  <g mask="url(#a)">
				    <path fill="#555" d="M0 0h${ leftSize }v${ height }H0z"/>
				    <path fill="#4c1" d="M${ leftSize } 0h${ rightSize }v${ height }H${ leftSize }z"/>
				    <path fill="url(#b)" d="M0 0h${ width }v${ height }H0z"/>
				  </g>
				    ${ hideIcon ? '' : '<image x="5" y="3" width="14" height="14" xlink:href="data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz48IURPQ1RZUEUgc3ZnIFBVQkxJQyAiLS8vVzNDLy9EVEQgU1ZHIDEuMS8vRU4iICJodHRwOi8vd3d3LnczLm9yZy9HcmFwaGljcy9TVkcvMS4xL0RURC9zdmcxMS5kdGQiPjxzdmcgdmVyc2lvbj0iMS4xIiBpZD0iTGF5ZXJfNSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgeD0iMHB4IiB5PSIwcHgiIHdpZHRoPSI1MTJweCIgaGVpZ2h0PSI1MTJweCIgdmlld0JveD0iMCAwIDUxMiA1MTIiIGVuYWJsZS1iYWNrZ3JvdW5kPSJuZXcgMCAwIDUxMiA1MTIiIHhtbDpzcGFjZT0icHJlc2VydmUiPjxwYXRoIGZpbGw9IiNDMTI3MkQiIGQ9Ik01MDIuNTg2LDI1NS4zMjJjMC0yNS4yMzYtNy41NS00OS40MzYtMjIuNDQ1LTcxLjkzMmMtMTMuMzczLTIwLjE5NS0zMi4xMDktMzguMDcyLTU1LjY4Ny01My4xMzJDMzc4LjkzNywxMDEuMTgyLDMxOS4xMDgsODUuMTY4LDI1Niw4NS4xNjhjLTIxLjA3OSwwLTQxLjg1NSwxLjc4MS02Mi4wMDksNS4zMWMtMTIuNTA0LTExLjcwMi0yNy4xMzktMjIuMjMyLTQyLjYyNy0zMC41NkM2OC42MTgsMTkuODE4LDAsNTguOTc1LDAsNTguOTc1czYzLjc5OCw1Mi40MDksNTMuNDI0LDk4LjM1Yy0yOC41NDIsMjguMzEzLTQ0LjAxLDYyLjQ1My00NC4wMSw5Ny45OThjMCwwLjExMywwLjAwNiwwLjIyNiwwLjAwNiwwLjM0YzAsMC4xMTMtMC4wMDYsMC4yMjYtMC4wMDYsMC4zMzljMCwzNS41NDUsMTUuNDY5LDY5LjY4NSw0NC4wMSw5Ny45OTlDNjMuNzk4LDM5OS45NCwwLDQ1Mi4zNSwwLDQ1Mi4zNXM2OC42MTgsMzkuMTU2LDE1MS4zNjMtMC45NDNjMTUuNDg4LTguMzI3LDMwLjEyNC0xOC44NTcsNDIuNjI3LTMwLjU2YzIwLjE1NCwzLjUyOCw0MC45MzEsNS4zMSw2Mi4wMDksNS4zMWM2My4xMDgsMCwxMjIuOTM3LTE2LjAxNCwxNjguNDU0LTQ1LjA5MWMyMy41NzctMTUuMDYsNDIuMzEzLTMyLjkzNyw1NS42ODctNTMuMTMyYzE0Ljg5Ni0yMi40OTYsMjIuNDQ1LTQ2LjY5NSwyMi40NDUtNzEuOTMyYzAtMC4xMTMtMC4wMDYtMC4yMjYtMC4wMDYtMC4zMzlDNTAyLjU4LDI1NS41NDgsNTAyLjU4NiwyNTUuNDM2LDUwMi41ODYsMjU1LjMyMnoiLz48cGF0aCBmaWxsPSIjRkZGRkZGIiBkPSJNMjU2LDEyMC44NDdjMTE2Ljg1NCwwLDIxMS41ODYsNjAuNTA5LDIxMS41ODYsMTM1LjE1NGMwLDc0LjY0MS05NC43MzEsMTM1LjE1NS0yMTEuNTg2LDEzNS4xNTVjLTI2LjAxOSwwLTUwLjkzNy0zLjAwOS03My45NTktOC40OTVjLTIzLjM5NiwyOC4xNDctNzQuODY4LDY3LjI4LTEyNC44NjksNTQuNjI5YzE2LjI2NS0xNy40Nyw0MC4zNjEtNDYuOTg4LDM1LjIwMS05NS42MDNjLTI5Ljk2OC0yMy4zMjItNDcuOTU5LTUzLjE2My00Ny45NTktODUuNjg2QzQ0LjQxNCwxODEuMzU2LDEzOS4xNDUsMTIwLjg0NywyNTYsMTIwLjg0NyIvPjxnPjxnPjxjaXJjbGUgZmlsbD0iI0MxMjcyRCIgY3g9IjI1NiIgY3k9IjI2MC4zNTIiIHI9IjI4LjEwNSIvPjwvZz48Zz48Y2lyY2xlIGZpbGw9IiNDMTI3MkQiIGN4PSIzNTMuNzI4IiBjeT0iMjYwLjM1MiIgcj0iMjguMTA0Ii8+PC9nPjxnPjxjaXJjbGUgZmlsbD0iI0MxMjcyRCIgY3g9IjE1OC4yNzIiIGN5PSIyNjAuMzUyIiByPSIyOC4xMDUiLz48L2c+PC9nPjxnPjxwYXRoIGZpbGw9IiNDQ0NDQ0MiIGQ9Ik0yNTYsMzczLjM3M2MtMjYuMDE5LDAtNTAuOTM3LTIuNjA3LTczLjk1OS03LjM2MmMtMjAuNjU5LDIxLjU0LTYzLjIwOSw1MC40OTYtMTA3LjMwNyw0OS40M2MtNS44MDYsOC44MDUtMTIuMTIxLDE2LjAwNi0xNy41NjIsMjEuODVjNTAsMTIuNjUxLDEwMS40NzMtMjYuNDgxLDEyNC44NjktNTQuNjI5YzIzLjAyMyw1LjQ4Niw0Ny45NDEsOC40OTUsNzMuOTU5LDguNDk1YzExNS45MTcsMCwyMTAuMDQ4LTU5LjU1LDIxMS41NTEtMTMzLjM2NEM0NjYuMDQ4LDMyMS43NjUsMzcxLjkxNywzNzMuMzczLDI1NiwzNzMuMzczeiIvPjwvZz48L3N2Zz4="/>' }
				  <g fill="#fff" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
						${ name ? `<text x="${ iconSize }" y="15" fill="#010101" fill-opacity=".3">${ name }</text>
				    <text x="${ iconSize }" y="14">${ name }</text>` : '' }
				    <text x="${ leftSize + 7 }" y="15" fill="#010101" fill-opacity=".3">${ text }</text>
				    <text x="${ leftSize + 7 }" y="14">${ text }</text>
				  </g>
				</svg>
			`.trim().replace(/\>[\s]+\</gm, '><')
		};
	}
});
