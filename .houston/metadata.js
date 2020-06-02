const getMongoVersion = async function({ version, git }) {
	try {
		const workflows = await git.show([`${ version }:.github/workflows/build_and_test.yml`]);

		const mongoMatch = workflows.match(/mongodb\-version: \[([^\]]+)\]/);
		if (!mongoMatch) {
			return [];
		}

		return mongoMatch[1].replace(/"/g, '').replace(/ /g, '').split(',');
	} catch (e) {
		console.error(e);
	}
	return [];
};

const getNodeNpmVersions = async function({ version, git, request }) {
	try {
		const meteorRelease = await git.show([`${ version }:.meteor/release`]);
		if (!/^METEOR@(\d+\.){1,2}\d/.test(meteorRelease)) {
			return {};
		}

		const meteorVersion = meteorRelease.replace(/\n|\s/g, '');

		const requestResult = await request(`https://raw.githubusercontent.com/meteor/meteor/release/${ meteorVersion }/scripts/build-dev-bundle-common.sh`);

		return {
			node_version: requestResult.match(/NODE_VERSION=((?:\d+\.){2}\d)/m)[1],
			npm_version: requestResult.match(/NPM_VERSION=((?:\d+\.){2}\d)/m)[1],
		};
	} catch (e) {
		console.error(e);
	}

	return {};
};

module.exports = async function({ version, git, request }) {
	const mongo_versions = await getMongoVersion({ version, git });
	const {
		node_version,
		npm_version,
	} = await getNodeNpmVersions({ version, git, request });

	return {
		node_version,
		npm_version,
		mongo_versions,
	};
};
