import mainContent from '../pageobjects/main-content.page';
import sideNav from '../pageobjects/side-nav.page';
import { username, email, password } from '../../data/user.js';
import { checkIfUserIsValid } from '../../data/checks';

describe('[Emoji]', () => {
	before(() => {
		checkIfUserIsValid(username, email, password);
		sideNav.spotlightSearchIcon.click();
		sideNav.searchChannel('general');
	});

	describe('Render:', () => {
		before(() => {
			mainContent.emojiBtn.click();
		});

		after(() => {
			mainContent.emojiSmile.first().click();
			mainContent.setTextToInput('');
		});

		it('it should show the emoji picker menu', () => {
			mainContent.emojiPickerMainScreen.should('be.visible');
		});

		it('it should click the emoji picker people tab', () => {
			mainContent.emojiPickerPeopleIcon.click();
		});

		it('it should show the emoji picker people tab', () => {
			mainContent.emojiPickerPeopleIcon.should('be.visible');
		});

		it('it should show the emoji picker nature tab', () => {
			mainContent.emojiPickerNatureIcon.should('be.visible');
		});

		it('it should show the emoji picker food tab', () => {
			mainContent.emojiPickerFoodIcon.should('be.visible');
		});

		it('it should show the emoji picker activity tab', () => {
			mainContent.emojiPickerActivityIcon.should('be.visible');
		});

		it('it should show the emoji picker travel tab', () => {
			mainContent.emojiPickerTravelIcon.should('be.visible');
		});

		it('it should show the emoji picker objects tab', () => {
			mainContent.emojiPickerObjectsIcon.should('be.visible');
		});

		it('it should show the emoji picker symbols tab', () => {
			mainContent.emojiPickerSymbolsIcon.should('be.visible');
		});

		it('it should show the emoji picker flags tab', () => {
			mainContent.emojiPickerFlagsIcon.should('be.visible');
		});

		it('it should show the emoji picker custom tab', () => {
			mainContent.emojiPickerCustomIcon.should('be.visible');
		});

		it('it should show the emoji picker change tone button', () => {
			mainContent.emojiPickerChangeTone.should('be.visible');
		});

		it('it should show the emoji picker search bar', () => {
			mainContent.emojiPickerFilter.should('be.visible');
		});
	});

	describe('[Usage]', () => {
		describe('send emoji via screen:', () => {
			before(() => {
				mainContent.emojiBtn.click();
				mainContent.emojiPickerPeopleIcon.click();
			});

			it('it should select a grinning emoji', () => {
				mainContent.emojiGrinning.first().click();
			});

			it('it should be that the value on the message input is the same as the emoji clicked', () => {
				mainContent.messageInput.should('have.value', ':grinning: ');
			});

			it('it should send the emoji', () => {
				mainContent.addTextToInput(' ');
				mainContent.sendBtn.click();
			});

			it('it should be that the value on the message is the same as the emoji clicked', () => {
				mainContent.lastMessage.should('contain', '😀');
			});
		});

		describe('send emoji via text:', () => {
			it('it should add emoji text to the message input', () => {
				mainContent.addTextToInput(':smile');
			});

			it('it should show the emoji popup bar', () => {
				mainContent.messagePopUp.should('be.visible');
			});

			it('it should be that the emoji popup bar title is emoji', () => {
				mainContent.messagePopUpTitle.should('contain', 'Emoji');
			});

			it('it should show the emoji popup bar items', () => {
				mainContent.messagePopUpItems.should('be.visible');
			});

			it('it should click the first emoji on the popup list', () => {
				mainContent.messagePopUpFirstItem.click();
			});

			it('it should be that the value on the message input is the same as the emoji clicked', () => {
				mainContent.messageInput.should('have.value', ':smile: ');
			});

			it('it should send the emoji', () => {
				mainContent.sendBtn.click();
			});

			it('it should be that the value on the message is the same as the emoji clicked', () => {
				mainContent.lastMessage.should('contain', '😄');
			});
		});

		describe("send texts and make sure they're not converted to emojis:", () => {
			it('should render numbers', () => {
				mainContent.sendMessage('0 1 2 3 4 5 6 7 8 9');
				mainContent.waitForLastMessageEqualsHtml('0 1 2 3 4 5 6 7 8 9');
			});

			it('should render special characters', () => {
				mainContent.sendMessage('® * © ™ #');
				mainContent.waitForLastMessageEqualsHtml('® * © ™ #');
			});
		});
	});
});
