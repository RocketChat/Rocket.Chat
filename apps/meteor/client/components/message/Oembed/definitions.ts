type OgImage = {
	ogImage: string;
	ogImageSecureUrl: string;
	ogImageWidth: string;
	ogImageHeight: string;
	ogImageType: string;
};

type OpenGraph = {
	ogLocale: string;
	ogType: string;
	ogTitle: string;
	ogDescription: string;
	ogUrl: string;
	ogSiteName: string;
} & OgImage;

type RocketchatOembed = {
	pageTitle: string;
	title: string;
	description: string;
	msapplicationTileImage: string;
};

type OembedHeader = {
	contentType: string;
};

type TwitterOembed = {
	twitterCard: string;
	twitterTitle: string;
	twitterDescription: string;
	twitterSite: string;
	twitterCreator: string;
	twitterImage: string;
};

export type Url = {
	meta: RocketchatOembed & OpenGraph & TwitterOembed;
	headers: OembedHeader;
};

export type Oembed = {
	title: string;
	description: string;
	url: string;
};
