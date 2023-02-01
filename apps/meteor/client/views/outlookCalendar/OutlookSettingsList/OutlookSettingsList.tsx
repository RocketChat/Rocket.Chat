import type { IGroupVideoConference } from '@rocket.chat/core-typings';
import { ButtonGroup, Button } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import VerticalBar from '../../../components/VerticalBar';
import OutlookSettingItem from './OutlookSettingItem';

type OutlookSettingsListProps = {
	onClose: () => void;
	onChangeRoute: () => void;
	total: number;
	videoConfs: IGroupVideoConference[];
	loading: boolean;
	error?: Error;
	reload: () => void;
	loadMoreItems: (min: number, max: number) => void;
};

const calendarSettings = [
	{
		title: 'Event notifications',
		subTitle: 'By disabling this setting you’ll prevent the app to notify you of upcoming events.',
		link: '#',
	},
	{
		title: 'Authentication',
		subTitle: 'This allows for the app to work properly. You’ll have to authenticate again if you disable this.',
		link: '#',
	},
];

const OutlookSettingsList = ({ onClose, onChangeRoute, loading, error, reload, loadMoreItems }: OutlookSettingsListProps): ReactElement => {
	const t = useTranslation();

	if (loading) {
		return <VerticalBar.Skeleton />;
	}

	return (
		<>
			<VerticalBar.Header>
				<VerticalBar.Icon name='calendar' />
				<VerticalBar.Text>{t('Outlook_Calendar_settings')}</VerticalBar.Text>
				<VerticalBar.Close onClick={onClose} />
			</VerticalBar.Header>
			<VerticalBar.Content paddingInline={0} color='default'>
				{calendarSettings.map((setting) => (
					<OutlookSettingItem settingData={setting} />
				))}
			</VerticalBar.Content>
			<VerticalBar.Footer>
				<ButtonGroup stretch>
					<Button onClick={onChangeRoute}>{t('Back_to_calendar')}</Button>
				</ButtonGroup>
			</VerticalBar.Footer>
		</>
	);
};

export default OutlookSettingsList;
