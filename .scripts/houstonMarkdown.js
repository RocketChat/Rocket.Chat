module.exports = async function(version, { node_version, npm_version, mongo_versions }) {
	if (!node_version && !npm_version && !mongo_versions) {
		return version;
	}
	const { body: oldBody } = version;

	version.body = '\n### Engine versions';

	if (node_version) {
		version.body += `\n- Node: \`${ node_version }\``;
	}

	if (npm_version) {
		version.body += `\n- NPM: \`${ npm_version }\``;
	}

	if (mongo_versions) {
		version.body += `\n- MongoDB: \`${ mongo_versions.join(', ') }\``;
	}

	version.body += `\n${ oldBody }`;
	return version;
};
