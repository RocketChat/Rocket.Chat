export class Utilities {
	static getI18nKeyForApp(key, appId) {
		return key && `apps-${appId}-${key}`;
	}

	static curl({ method, params, auth, headers = {}, url, query, content }, opts = {}) {
		const newLine = '\\\n   ';

		const cmd = ['curl'];

		// curl options
		if (opts.verbose) {
			cmd.push('-v');
		}
		if (opts.headers) {
			cmd.push('-i');
		}

		// method
		cmd.push('-X');
		cmd.push((method || 'GET').toUpperCase());

		// URL
		let u = url;

		if (typeof params === 'object') {
			Object.entries(params).forEach(([key, value]) => {
				u = u.replace(`:${key}`, value);
			});
		}

		if (typeof query === 'object') {
			const queryString = Object.entries(query)
				.map(([key, value]) => `${key}=${value}`)
				.join('&');
			u += `?${queryString}`;
		}
		cmd.push(u);

		// username
		if (auth) {
			cmd.push(newLine);
			cmd.push('-u');
			cmd.push(auth);
		}

		// headers
		const headerKeys = [];
		Object.entries(headers).forEach(([key, val]) => {
			key = key.toLowerCase();
			headerKeys.push(key);
			cmd.push(newLine);
			cmd.push('-H');
			cmd.push(`"${key}${val ? ': ' : ';'}${val || ''}"`);
		});

		if (content) {
			if (typeof content === 'object') {
				if (!headerKeys.includes('content-type')) {
					cmd.push(newLine);
					cmd.push('-H');
					cmd.push('"content-type: application/json"');
				}
				content = JSON.stringify(content);
			}

			cmd.push(newLine);
			cmd.push('--data-binary');
			cmd.push(`'${content}'`);
		}

		return cmd.join(' ');
	}
}
