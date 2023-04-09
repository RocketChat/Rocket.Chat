import { Trans } from 'react-i18next';
import type { ReactElement } from 'react';
import { Link, HorizontalWizardLayoutCaption } from '@rocket.chat/layout';
import { useSetting } from '@rocket.chat/ui-contexts';

const anchorRegex = /<a href="([^"]+)">([^<]+)<\/a>/g;

const extractLinkValuesAndElements = (text: string): [{ [key: string]: string }, ReactElement[]] => {
	const values: { [key: string]: string } = {};
	const links: ReactElement[] = [];
	text.replace(anchorRegex, (_, url, text) => {
		values[url] = text;
		links.push(<Link href={url} />);
		return '';
	});
	return [values, links];
};

const replaceLinksWithPlaceholders = (text: string, values: { [key: string]: string }): string => {
	let index = 0;
	return text.replace(anchorRegex, () => {
		const key = Object.keys(values)[index];
		return `<${index++}>{{${key}}}</${index - 1}>`;
	});
};

// Should this be in a ENV variable?
const defaultTerms =
	'By proceeding you are agreeing to our <a href="privacy-policy">Privacy Policy</a>, <a href="terms-of-service">Terms of Service</a> and <a href="legal-notice">Legal Notice</a>.';

export const LoginTerms = (): ReactElement => {
	const layoutLoginTerms = useSetting('Layout_Login_Terms');
	const text = typeof layoutLoginTerms === 'string' && layoutLoginTerms.length > 0 ? layoutLoginTerms : defaultTerms;
	const [values, links] = extractLinkValuesAndElements(text);
	const defaults = replaceLinksWithPlaceholders(text, values);

	return (
		<HorizontalWizardLayoutCaption>
			<Trans defaults={defaults} values={values} components={links} />
		</HorizontalWizardLayoutCaption>
	);
};

export default LoginTerms;
