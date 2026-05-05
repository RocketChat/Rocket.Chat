export type LoginStyle = 'popup' | 'redirect';

export type LoginStyleConfig = {
	loginStyle?: string;
};

export type LoginStyleOptions = {
	loginStyle?: string;
};

export type StateParamOptions = {
	isCordova?: boolean;
	setRedirectUrlWhenLoginStyleIsPopup?: boolean;
};

export type PopupDimensions = {
	width?: number;
	height?: number;
};

export type LaunchLoginOptions = {
	loginService: string;
	loginStyle: LoginStyle;
	loginUrl: string;
	credentialRequestCompleteCallback?: (credentialTokenOrError?: string | Error) => void;
	credentialToken: string;
	popupOptions?: PopupDimensions;
};
