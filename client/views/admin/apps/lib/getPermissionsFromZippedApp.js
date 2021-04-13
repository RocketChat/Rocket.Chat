import { unzipSync, strFromU8 } from 'fflate';

async function fileToUint8Array(file) {
	return new Promise((resolve, reject) => {
		const fileReader = new FileReader();
		fileReader.onload = (e) => resolve(new Uint8Array(e.target.result));
		fileReader.onerror = (e) => reject(e);
		fileReader.readAsArrayBuffer(file);
	});
}

function unzipAppBuffer(zippedAppBuffer) {
	return unzipSync(zippedAppBuffer);
}

function getAppManifest(unzippedAppBuffer) {
	if (!unzippedAppBuffer['app.json']) {
		throw new Error('No app.json file found in the zip');
	}

	try {
		return JSON.parse(strFromU8(unzippedAppBuffer['app.json']));
	} catch (e) {
		throw new Error('Failed to parse app.json', e);
	}
}

function getPermissionsFromManifest(manifest) {
	if (!manifest.permissions) {
		return undefined;
	}

	if (!Array.isArray(manifest.permissions)) {
		throw new Error('The "permissions" property from app.json is invalid');
	}

	return manifest.permissions;
}

export async function getPermissionsFromZippedApp(zippedApp) {
	try {
		if (zippedApp instanceof File) {
			zippedApp = await fileToUint8Array(zippedApp);
		}

		const unzippedBuffer = unzipAppBuffer(zippedApp);
		const manifest = getAppManifest(unzippedBuffer);
		const permissions = getPermissionsFromManifest(manifest);
		return permissions;
	} catch (e) {
		console.error(e);
		throw e;
	}
}
