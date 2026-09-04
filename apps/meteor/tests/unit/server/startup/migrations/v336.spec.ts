import { expect } from 'chai';
import { describe, it } from 'mocha';

import { bumpBannerConfigToV2 } from '../../../../../server/startup/migrations/lib/bumpBannerConfigToV2';

/**
 * ABAC-P4 M4 — migration v336 bumps the classification-banner config to schema v2.
 *
 * v2 is a strict superset of v1, so the only change a stored document needs is its `version`. The
 * cases that matter most are the ones the migration must decline to touch.
 */
describe('migration v336 — classification banner config v1 → v2', () => {
	const v1Config = {
		version: 1,
		enabled: true,
		banner: {
			style: 'classic',
			uppercase: true,
			monospace: false,
			delimiter: ' // ',
			colorMode: 'highest',
			fallbackText: 'UNCLASSIFIED',
			fallbackColor: '#007a33',
		},
		attributes: [
			{
				id: 'classification',
				source: 'clearance',
				label: 'Clearance',
				showInBanner: true,
				drivesColor: true,
				values: [{ source: 'S', label: 'SECRET', color: '#c8102e' }],
			},
		],
	};

	it('bumps a v1 document to v2 and changes nothing else', () => {
		const migrated = bumpBannerConfigToV2(JSON.stringify(v1Config));

		expect(migrated).to.be.a('string');

		const parsed = JSON.parse(migrated as string);
		expect(parsed.version).to.equal(2);

		// Everything a v1 config renders from must survive verbatim, or an existing workspace's
		// banner changes appearance on upgrade.
		expect(parsed.banner).to.deep.equal(v1Config.banner);
		expect(parsed.attributes).to.deep.equal(v1Config.attributes);
		expect(parsed.enabled).to.equal(true);
	});

	it('does not synthesise a nonAbacBanner — absence preserves the pre-v2 behaviour', () => {
		const parsed = JSON.parse(bumpBannerConfigToV2(JSON.stringify(v1Config)) as string);

		expect(parsed).to.not.have.property('nonAbacBanner');
	});

	it('leaves an already-migrated v2 document alone', () => {
		expect(bumpBannerConfigToV2(JSON.stringify({ ...v1Config, version: 2 }))).to.equal(null);
	});

	it('leaves a version it does not know alone', () => {
		expect(bumpBannerConfigToV2(JSON.stringify({ ...v1Config, version: 7 }))).to.equal(null);
	});

	it('leaves an unconfigured setting alone', () => {
		expect(bumpBannerConfigToV2('')).to.equal(null);
		expect(bumpBannerConfigToV2('   ')).to.equal(null);
		expect(bumpBannerConfigToV2(undefined)).to.equal(null);
	});

	it('does not destroy a document that is not parseable JSON', () => {
		// An administrator may have a half-typed value saved; a migration must not eat it.
		expect(bumpBannerConfigToV2('{ "version": 1, ')).to.equal(null);
	});

	it('ignores a JSON value that is not an object', () => {
		expect(bumpBannerConfigToV2('[]')).to.equal(null);
		expect(bumpBannerConfigToV2('"a string"')).to.equal(null);
		expect(bumpBannerConfigToV2('null')).to.equal(null);
	});
});
