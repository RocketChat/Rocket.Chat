const Keys = {
	TAB: '\uE004',
	ENTER: '\uE007',
	ESCAPE: 'u\ue00c',
};

const sendEnter = function () {
	browser.keys(Keys.ENTER);
};

const sendEscape = function () {
	browser.keys(Keys.ESCAPE);
};

const sendTab = function () {
	browser.keys(Keys.TAB);
};

export { sendEnter, sendEscape, sendTab };
