class ScreenSize {
	isDesktop() {
		return window.matchMedia('screen and (min-width: 781px)').matches;
	}

	isTablet() {
		return window.matchMedia('screen and (max-width: 780px)').matches;
	}

	isMobile() {
		return window.matchMedia('screen and (max-width: 480px)').matches;
	}

	isPortrait() {
		return window.matchMedia('screen and (orientation: portrait)').matches;
	}

	isLandscape() {
		return window.matchMedia('screen and (orientation: landscape)').matches;
	}
}

RocketChat.ScreenSize = new ScreenSize;
