export const injectSliderRTLFix = (): void => {
    const id = 'rcx-slider-rtl-fix';
    if (document.getElementById(id)) {
        return;
    }
    const styleElement = document.createElement('style');
    styleElement.id = id;
    styleElement.innerHTML = `
		[dir='rtl'] .rcx-slider-track {
			left: auto !important;
			right: auto !important;
			inset-inline-start: 0 !important;
		}

		[dir='rtl'] .rcx-slider-track::before {
			transform: scaleX(-1) !important;
			transform-origin: center !important;
		}
	`;
    document.head.appendChild(styleElement);
};
