import { unzipSync, strFromU8 } from 'fflate';

type Uint8ArrayObject = { [fileName: string]: Uint8Array };
type AppManifestSchema = { [key: string]: string };

async function fileToUint8Array(file: File): Promise<Uint8Array> {
	return new Promise((resolve, reject) => {
		const fileReader = new FileReader();
		fileReader.onload = (e): void => resolve(new Uint8Array((e.target as any).result as Uint8Array));
		fileReader.onerror = (e): void => reject(e);
		fileReader.readAsArrayBuffer(file);
	});
}

function unzipAppBuffer(zippedAppBuffer: Uint8Array): Uint8ArrayObject {
	return unzipSync(zippedAppBuffer);
}

function getAppManifest(unzippedAppBuffer: Uint8ArrayObject): AppManifestSchema {
	if (!unzippedAppBuffer['app.json']) {
		throw new Error('No app.json file found in the zip');
	}

	try {
		return JSON.parse(strFromU8(unzippedAppBuffer['app.json']));
	} catch (e) {
		throw new Error(`Failed to parse app.json: ${e.message}`);
	}
}

async function unzipZippedApp(zippedApp: File | Uint8Array): Promise<Uint8ArrayObject> {
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

export async function getManifestFromZippedApp(zippedApp: File): Promise<AppManifestSchema> {
	const unzippedBuffer = await unzipZippedApp(zippedApp);
	return getAppManifest(unzippedBuffer);
}
