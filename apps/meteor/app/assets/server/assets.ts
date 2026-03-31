import crypto from 'crypto';
import type { ServerResponse, IncomingMessage } from 'http';

import type { IRocketChatAssets, IRocketChatAsset, ISetting } from '@rocket.chat/core-typings';
import { Settings } from '@rocket.chat/models';
import type { NextHandleFunction } from 'connect';
import sizeOf from 'image-size';
import { Meteor } from 'meteor/meteor';
import { WebApp, WebAppInternals } from 'meteor/webapp';
import sharp from 'sharp';

import { hasPermissionAsync } from '../../authorization/server/functions/hasPermission';
import { RocketChatFile } from '../../file/server';
import { notifyOnSettingChangedById } from '../../lib/server/lib/notifyListener';
import { settings, settingsRegistry } from '../../settings/server';
import { getExtension } from '../../utils/lib/mimeTypes';
import { getURL } from '../../utils/server/getURL';

const RocketChatAssetsInstance = new RocketChatFile.GridFS({
	name: 'assets',
});

type IRocketChatAssetsConfig = Record<keyof IRocketChatAssets, IRocketChatAsset & { settingOptions?: Partial<ISetting> }>;

const assets: IRocketChatAssetsConfig = {
	logo: {
		label: 'logo (svg, png, jpg)',
		defaultUrl: 'images/logo/logo.svg',
		constraints: {
			type: 'image',
			extensions: ['svg', 'png', 'jpg', 'jpeg'],
		},
		wizard: {
			step: 3,
			order: 2,
		},
	},
	logo_dark: {
		label: 'logo - dark theme (svg, png, jpg)',
		defaultUrl: 'images/logo/logo_dark.svg',
		constraints: {
			type: 'image',
			extensions: ['svg', 'png', 'jpg', 'jpeg'],
		},
	},
	background: {
		label: 'login background (svg, png, jpg)',
		constraints: {
			type: 'image',
			extensions: ['svg', 'png', 'jpg', 'jpeg'],
		},
	},
	background_dark: {
		label: 'login background - dark theme (svg, png, jpg)',
		constraints: {
			type: 'image',
			extensions: ['svg', 'png', 'jpg', 'jpeg'],
		},
	},
	favicon_ico: {
		label: 'favicon (ico)',
		defaultUrl: 'favicon.ico',
		constraints: {
			type: 'image',
			extensions: ['ico'],
		},
	},
	favicon: {
		label: 'favicon (svg)',
		defaultUrl: 'images/logo/icon.svg',
		constraints: {
			type: 'image',
			extensions: ['svg'],
		},
	},
	favicon_16: {
		label: 'favicon 16x16 (png)',
		defaultUrl: 'images/logo/favicon-16x16.png',
		constraints: {
			type: 'image',
			extensions: ['png'],
			width: 16,
			height: 16,
		},
	},
	favicon_32: {
		label: 'favicon 32x32 (png)',
		defaultUrl: 'images/logo/favicon-32x32.png',
		constraints: {
			type: 'image',
			extensions: ['png'],
			width: 32,
			height: 32,
		},
	},
	favicon_192: {
		label: 'android-chrome 192x192 (png)',
		defaultUrl: 'images/logo/android-chrome-192x192.png',
		constraints: {
			type: 'image',
			extensions: ['png'],
			width: 192,
			height: 192,
		},
	},
	favicon_512: {
		label: 'android-chrome 512x512 (png)',
		defaultUrl: 'images/logo/android-chrome-512x512.png',
		constraints: {
			type: 'image',
			extensions: ['png'],
			width: 512,
			height: 512,
		},
	},
	touchicon_180: {
		label: 'apple-touch-icon 180x180 (png)',
		defaultUrl: 'images/logo/apple-touch-icon.png',
		constraints: {
			type: 'image',
			extensions: ['png'],
			width: 180,
			height: 180,
		},
	},
	touchicon_180_pre: {
		label: 'apple-touch-icon-precomposed 180x180 (png)',
		defaultUrl: 'images/logo/apple-touch-icon-precomposed.png',
		constraints: {
			type: 'image',
			extensions: ['png'],
			width: 180,
			height: 180,
		},
	},
	tile_70: {
		label: 'mstile 70x70 (png)',
		defaultUrl: 'images/logo/mstile-70x70.png',
		constraints: {
			type: 'image',
			extensions: ['png'],
			width: 70,
			height: 70,
		},
	},
	tile_144: {
		label: 'mstile 144x144 (png)',
		defaultUrl: 'images/logo/mstile-144x144.png',
		constraints: {
			type: 'image',
			extensions: ['png'],
			width: 144,
			height: 144,
		},
	},
	tile_150: {
		label: 'mstile 150x150 (png)',
		defaultUrl: 'images/logo/mstile-150x150.png',
		constraints: {
			type: 'image',
			extensions: ['png'],
			width: 150,
			height: 150,
		},
	},
	tile_310_square: {
		label: 'mstile 310x310 (png)',
		defaultUrl: 'images/logo/mstile-310x310.png',
		constraints: {
			type: 'image',
			extensions: ['png'],
			width: 310,
			height: 310,
		},
	},
	tile_310_wide: {
		label: 'mstile 310x150 (png)',
		defaultUrl: 'images/logo/mstile-310x150.png',
		constraints: {
			type: 'image',
			extensions: ['png'],
			width: 310,
			height: 150,
		},
	},
	safari_pinned: {
		label: 'safari pinned tab (svg)',
		defaultUrl: 'images/logo/safari-pinned-tab.svg',
		constraints: {
			type: 'image',
			extensions: ['svg'],
		},
	},
	livechat_widget_logo: {
		label: 'widget logo (svg, png, jpg)',
		constraints: {
			type: 'image',
			extensions: ['svg', 'png', 'jpg', 'jpeg'],
		},
		settingOptions: {
			section: 'Livechat',
			group: 'Omnichannel',
			invalidValue: {
				defaultUrl: undefined,
			},
			enableQuery: { _id: 'Livechat_enabled', value: true },
			enterprise: true,
			modules: ['livechat-enterprise'],
			sorter: 999 + 1,
		},
	},
};

function getAssetByKey(key: string) {
	return assets[key as keyof IRocketChatAssets];
}

class RocketChatAssetsClass {
	get assets(): IRocketChatAssets {
		return assets;
	}

	public async setAssetWithBuffer(
		file: Buffer,
		contentType: string,
		asset: string,
	): Promise<{
		key: string;
		value: IRocketChatAsset;
	}> {
		const assetInstance = getAssetByKey(asset);
		if (!assetInstance) {
			throw new Meteor.Error('error-invalid-asset', 'Invalid asset', {
				function: 'RocketChat.Assets.setAsset',
			});
		}

		const extension = getExtension(contentType);
		if (assetInstance.constraints.extensions.includes(extension) === false) {
			throw new Meteor.Error('error-invalid-file-type', `Invalid file type: ${contentType}`, {
				function: 'RocketChat.Assets.setAsset',
			});
		}

		if (assetInstance.constraints.width || assetInstance.constraints.height) {
			const dimensions = sizeOf(file);
			if (assetInstance.constraints.width && assetInstance.constraints.width !== dimensions.width) {
				throw new Meteor.Error('error-invalid-file-width', 'Invalid file width', {
					function: 'Invalid file width',
				});
			}
			if (assetInstance.constraints.height && assetInstance.constraints.height !== dimensions.height) {
				throw new Meteor.Error('error-invalid-file-height');
			}
		}

		const rs = RocketChatFile.bufferToStream(file);
		await RocketChatAssetsInstance.deleteFile(asset);

		const ws = RocketChatAssetsInstance.createWriteStream(asset, contentType);

		return new Promise((resolve) => {
			ws.on('end', () => {
				return setTimeout(async () => {
					const key = `Assets_${asset}`;
					const value = {
						url: `assets/${asset}.${extension}`,
						defaultUrl: assetInstance.defaultUrl,
					} as IRocketChatAsset;

					await RocketChatAssets.processAsset(key, value);
					resolve({
						key,
						value,
					});
				}, 200);
			});

			rs.pipe(ws);
		});
	}

	public async unsetAsset(asset: string) {
		if (!getAssetByKey(asset)) {
			throw new Meteor.Error('error-invalid-asset', 'Invalid asset', {
				function: 'RocketChat.Assets.unsetAsset',
			});
		}

		await RocketChatAssetsInstance.deleteFile(asset);
		const key = `Assets_${asset}`;
		const value = {
			defaultUrl: getAssetByKey(asset).defaultUrl,
		};

		await RocketChatAssets.processAsset(key, value);

		return {
			key,
			value,
		};
	}

	public refreshClients(): boolean {
		return process.emit('message', {
			refresh: 'client',
		});
	}

	public async processAsset(settingKey: string, settingValue: any): Promise<Record<string, any> | undefined> {
		if (settingKey.indexOf('Assets_') !== 0) {
			return;
		}

		const assetKey = settingKey.replace(/^Assets_/, '');
		const assetValue = getAssetByKey(assetKey);

		if (!assetValue) {
			return;
		}

		if (!settingValue?.url) {
			assetValue.cache = undefined;
			return;
		}

		const file = await RocketChatAssetsInstance.getFile(assetKey);
		if (!file) {
			assetValue.cache = undefined;
			return;
		}

		const hash = crypto.createHash('sha1').update(file.buffer).digest('hex');
		const extension = settingValue.url.split('.').pop();

		assetValue.cache = {
			path: `assets/${assetKey}.${extension}`,
			cacheable: false,
			sourceMapUrl: undefined,
			where: 'client',
			type: 'asset',
			content: file.buffer,
			extension,
			url: `/assets/${assetKey}.${extension}?${hash}`,
			size: file.length,
			uploadDate: file.uploadDate,
			contentType: file.contentType,
			hash,
		};

		return assetValue.cache;
	}

	public getURL(assetName: string, options = { cdn: false, full: true }): string {
		const asset = settings.get<IRocketChatAsset>(assetName);
		const url = asset.url || asset.defaultUrl;

		return getURL(url as string, options);
	}
}

export const RocketChatAssets = new RocketChatAssetsClass();

export async function addAssetToSetting(asset: string, value: IRocketChatAsset, options?: Partial<ISetting>): Promise<void> {
	const key = `Assets_${asset}`;

	await settingsRegistry.add(
		key,
		{
			defaultUrl: value.defaultUrl,
		},
		{
			type: 'asset',
			group: 'Assets',
			fileConstraints: value.constraints,
			i18nLabel: value.label,
			asset,
			public: true,
			...options,
		},
	);

	const currentValue = settings.get<IRocketChatAsset>(key);

	if (currentValue && typeof currentValue === 'object' && currentValue.defaultUrl !== getAssetByKey(asset).defaultUrl) {
		currentValue.defaultUrl = getAssetByKey(asset).defaultUrl;

		(await Settings.updateValueById(key, currentValue)).modifiedCount && void notifyOnSettingChangedById(key);
	}
}

void (async () => {
	for await (const key of Object.keys(assets)) {
		const { wizard, settingOptions, ...value } = getAssetByKey(key);
		await addAssetToSetting(key, value, { ...settingOptions, wizard });
	}
})();

Meteor.startup(() => {
	setTimeout(() => {
		process.emit('message', {
			refresh: 'client',
		});
	}, 200);
});

export const refreshClients = async (userId: string) => {
	if (!userId) {
		throw new Error('Invalid user');
	}

	const _hasPermission = await hasPermissionAsync(userId, 'manage-assets');
	if (!_hasPermission) {
		throw new Error('Managing assets not allowed');
	}

	return RocketChatAssets.refreshClients();
};

const listener = (req: IncomingMessage, res: ServerResponse, next: NextHandleFunction) => {
	if (!req.url) {
		return;
	}
	const params = {
		asset: decodeURIComponent(req.url.replace(/^\//, '').replace(/\?.*$/, '')).replace(/\.[^.]*$/, ''),
	};

	const asset = getAssetByKey(params.asset);
	const file = asset?.cache;

	const format = req.url.replace(/.*\.([a-z]+)(?:$|\?.*)/i, '$1');

	if (asset && Array.isArray(asset.constraints.extensions) && !asset.constraints.extensions.includes(format)) {
		res.writeHead(403);
		res.end();
		return;
	}
	if (!file) {
		const defaultUrl = asset?.defaultUrl;
		if (defaultUrl) {
			const assetUrl = format && ['png', 'svg'].includes(format) ? defaultUrl.replace(/(svg|png)$/, format) : defaultUrl;
			req.url = `/${assetUrl}`;
			WebAppInternals.staticFilesMiddleware((WebAppInternals as Record<string, any>).staticFilesByArch, req, res, next);
		} else {
			res.writeHead(404);
			res.end();
		}

		return;
	}

	const reqModifiedHeader = req.headers['if-modified-since'];
	if (reqModifiedHeader) {
		if (reqModifiedHeader === file.uploadDate?.toUTCString()) {
			res.setHeader('Last-Modified', reqModifiedHeader);
			res.writeHead(304);
			res.end();
			return;
		}
	}

	res.setHeader('Cache-Control', 'public, max-age=0');
	res.setHeader('Expires', '-1');

	if (format && format !== file.extension && ['png', 'jpg', 'jpeg'].includes(format)) {
		res.setHeader('Content-Type', `image/${format}`);
		sharp(file.content)
			.toFormat(format as any)
			.pipe(res);
		return;
	}

	res.setHeader('Last-Modified', file.uploadDate?.toUTCString() || new Date().toUTCString());
	if (file.contentType) res.setHeader('Content-Type', file.contentType);
	if (file.size) res.setHeader('Content-Length', file.size);
	res.writeHead(200);
	res.end(file.content);
};

WebApp.connectHandlers.use('/assets/', listener);
