import { Banner } from '@rocket.chat/core-services';
import type { UiKit, IBanner, BannerPlatform } from '@rocket.chat/core-typings';
import { serverFetch as fetch } from '@rocket.chat/server-fetch';

import { getWorkspaceAccessToken } from '../../../app/cloud/server';
import { settings } from '../../../app/settings/server';
import { SystemLogger } from '../../lib/logger/system';

type NpsSurveyData = {
	id: string;
	platform: BannerPlatform[];
	roles: string[];
	survey: UiKit.BannerView;
	createdAt: Date;
	startAt: Date;
	expireAt: Date;
};

export const getAndCreateNpsSurvey = async function getNpsSurvey(npsId: string) {
	const token = await getWorkspaceAccessToken();
	if (!token) {
		return false;
	}

	const npsEnabled = settings.get('NPS_survey_enabled');

	if (!npsEnabled) {
		return false;
	}

	const npsUrl = settings.get('Nps_Url');

	try {
		const result = await fetch(`${npsUrl}/v1/surveys/${npsId}`, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});

		if (!result.ok) {
			SystemLogger.error({ msg: 'invalid response from the nps service:', result });
			return;
		}

		const surveyData = (await result.json()) as NpsSurveyData;

		const banner: IBanner = {
			_id: npsId,
			platform: surveyData.platform,
			createdAt: new Date(surveyData.createdAt),
			expireAt: new Date(surveyData.expireAt),
			startAt: new Date(surveyData.startAt),
			_updatedAt: new Date(), // Needed by the IRocketChatRecord interface
			roles: surveyData.roles,
			createdBy: {
				_id: 'rocket.cat',
				username: 'rocket.cat',
			},
			view: surveyData.survey,
			surface: 'banner',
		};

		await Banner.create(banner);
	} catch (e) {
		SystemLogger.error(e);
		return false;
	}
};
