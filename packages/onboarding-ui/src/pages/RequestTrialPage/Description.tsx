import colors from '@rocket.chat/fuselage-tokens/dist/colors.json';
import { List, DarkModeProvider, ListItem } from '@rocket.chat/layout';
import { useMemo } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { useTranslation } from 'react-i18next';

import PlanFeatureIcon from '../../common/PlanFeatureIcon';

const Description = () => {
	const isDarkMode = DarkModeProvider.useDarkMode();
	const color = isDarkMode ? colors.white : colors.n900;
	const { t } = useTranslation();

	const icon = useMemo(() => encodeURIComponent(renderToStaticMarkup(<PlanFeatureIcon color={color} />)), [color]);

	return (
		<>
			<List color={color} spacing='x16' icon={icon}>
				<ListItem fontScale='h4'>{t('page.cloudDescription.availability')}</ListItem>
				<ListItem fontScale='h4'>{t('page.cloudDescription.auditing')}</ListItem>
				<ListItem fontScale='h4'>{t('page.cloudDescription.numberOfIntegrations')}</ListItem>
				<ListItem fontScale='h4'>{t('page.cloudDescription.ldap')}</ListItem>
				<ListItem fontScale='h4'>{t('page.cloudDescription.omnichannel')}</ListItem>
				<ListItem fontScale='h4'>{t('page.cloudDescription.push')}</ListItem>
			</List>
		</>
	);
};

export default Description;
