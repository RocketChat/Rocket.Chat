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

async function unzipZippedApp(zippedApp) {
	try {
		if (zippedApp instanceof File) {
			zippedApp = await fileToUint8Array(zippedApp);
		}

		return unzipAppBuffer(zippedApp);
	} catch (e) {
		console.error(e);
		throw e;
	}
}

export async function getManifestFromZippedApp(zippedApp) {
	const unzippedBuffer = await unzipZippedApp(zippedApp);
	return getAppManifest(unzippedBuffer);
}
