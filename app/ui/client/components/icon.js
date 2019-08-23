import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import { Template } from 'meteor/templating';

import './icon.html';


const baseUrlFix = () => `${ document.baseURI }${ FlowRouter.current().path.substring(1) }`;

const isMozillaFirefoxBelowVersion = (upperVersion) => {
	const [, version] = navigator.userAgent.match(/Firefox\/(\d+)\.\d/) || [];
	return parseInt(version, 10) < upperVersion;
};

const isGoogleChromeBelowVersion = (upperVersion) => {
	const [, version] = navigator.userAgent.match(/Chrome\/(\d+)\.\d/) || [];
	return parseInt(version, 10) < upperVersion;
};

const isBaseUrlFixNeeded = () => isMozillaFirefoxBelowVersion(55) || isGoogleChromeBelowVersion(55);

Template.icon.helpers({
	baseUrl: isBaseUrlFixNeeded() ? baseUrlFix : undefined,
});
