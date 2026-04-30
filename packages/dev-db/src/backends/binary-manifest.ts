import os from 'node:os';

export type BinaryTarget = {
	platform: NodeJS.Platform;
	arch: NodeJS.Architecture;
	archiveName: string;
	downloadUrl: string;
	checksumUrl: string;
};

const DEFAULT_BINARY_VERSION = process.env.DEV_DB_BINARY_VERSION || '8.2.7';

const buildTarget = (platform: NodeJS.Platform, arch: NodeJS.Architecture, version: string): BinaryTarget | undefined => {
	if (platform === 'darwin' && arch === 'arm64') {
		const archiveName = `mongodb-macos-aarch64-${version}.tgz`;
		return {
			platform,
			arch,
			archiveName,
			downloadUrl: `https://fastdl.mongodb.org/osx/${archiveName}`,
			checksumUrl: `https://fastdl.mongodb.org/osx/${archiveName}.sha256`,
		};
	}

	if (platform === 'darwin' && arch === 'x64') {
		const archiveName = `mongodb-macos-x86_64-${version}.tgz`;
		return {
			platform,
			arch,
			archiveName,
			downloadUrl: `https://fastdl.mongodb.org/osx/${archiveName}`,
			checksumUrl: `https://fastdl.mongodb.org/osx/${archiveName}.sha256`,
		};
	}

	if (platform === 'linux' && arch === 'x64') {
		const archiveName = `mongodb-linux-x86_64-ubuntu2204-${version}.tgz`;
		return {
			platform,
			arch,
			archiveName,
			downloadUrl: `https://fastdl.mongodb.org/linux/${archiveName}`,
			checksumUrl: `https://fastdl.mongodb.org/linux/${archiveName}.sha256`,
		};
	}

	if (platform === 'linux' && arch === 'arm64') {
		const archiveName = `mongodb-linux-aarch64-ubuntu2204-${version}.tgz`;
		return {
			platform,
			arch,
			archiveName,
			downloadUrl: `https://fastdl.mongodb.org/linux/${archiveName}`,
			checksumUrl: `https://fastdl.mongodb.org/linux/${archiveName}.sha256`,
		};
	}

	return undefined;
};

export const resolveBinaryTarget = (): { version: string; target?: BinaryTarget } => {
	const version = DEFAULT_BINARY_VERSION;
	const platform = os.platform();
	const arch = os.arch() as NodeJS.Architecture;
	return {
		version,
		target: buildTarget(platform, arch, version),
	};
};
