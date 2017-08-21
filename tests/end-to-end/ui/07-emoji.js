/* eslint-env mocha */
/* eslint-disable func-names, prefer-arrow-callback */

import mainContent from '../../pageobjects/main-content.page';
import sideNav from '../../pageobjects/side-nav.page';

import {username, email, password} from '../../data/user.js';
import {checkIfUserIsValid} from '../../data/checks';

describe('[Emoji]', ()=> {
	before(()=>{
		checkIfUserIsValid(username, email, password);
		sideNav.spotlightSearch.waitForVisible(10000);
		sideNav.searchChannel('general');
	});


	describe('Render:', ()=> {
		before(()=> {
			mainContent.emojiBtn.click();
		});

		after(() => {
			mainContent.emojiSmile.click();
			mainContent.setTextToInput('');
		});

		it('it should show the emoji picker menu', ()=> {
			mainContent.emojiPickerMainScreen.isVisible().should.be.true;
		});

		it('it should click the emoji picker people tab', ()=> {
			mainContent.emojiPickerPeopleIcon.click();
		});

		it('it should show the emoji picker people tab', ()=> {
			mainContent.emojiPickerPeopleIcon.isVisible().should.be.true;
		});

		it('it should show the emoji picker nature tab', ()=> {
			mainContent.emojiPickerNatureIcon.isVisible().should.be.true;
		});

		it('it should show the emoji picker food tab', ()=> {
			mainContent.emojiPickerFoodIcon.isVisible().should.be.true;
		});

		it('it should show the emoji picker activity tab', ()=> {
			mainContent.emojiPickerActivityIcon.isVisible().should.be.true;
		});

		it('it should show the emoji picker travel tab', ()=> {
			mainContent.emojiPickerTravelIcon.isVisible().should.be.true;
		});

		it('it should show the emoji picker objects tab', ()=> {
			mainContent.emojiPickerObjectsIcon.isVisible().should.be.true;
		});

		it('it should show the emoji picker symbols tab', ()=> {
			mainContent.emojiPickerSymbolsIcon.isVisible().should.be.true;
		});

		it('it should show the emoji picker flags tab', ()=> {
			mainContent.emojiPickerFlagsIcon.isVisible().should.be.true;
		});

		it('it should show the emoji picker custom tab', ()=> {
			mainContent.emojiPickerCustomIcon.isVisible().should.be.true;
		});

		it('it should show the emoji picker change tone button', ()=> {
			mainContent.emojiPickerChangeTone.isVisible().should.be.true;
		});

		it('it should show the emoji picker search bar', ()=> {
			mainContent.emojiPickerFilter.isVisible().should.be.true;
		});
	});

	describe('[Usage]', ()=> {
		describe('send emoji via screen:', ()=> {
			before(()=> {
				mainContent.emojiBtn.click();
				mainContent.emojiPickerPeopleIcon.click();
			});

			it('it should select a grinning emoji', ()=> {
				mainContent.emojiGrinning.waitForVisible(5000);
				mainContent.emojiGrinning.click();
			});

			it('it should be that the value on the message input is the same as the emoji clicked', ()=> {
				mainContent.messageInput.getValue().should.equal(':grinning:');
			});

			it('it should send the emoji', ()=> {
				mainContent.addTextToInput(' ');
				mainContent.sendBtn.click();
			});

			it('it should be that the value on the message is the same as the emoji clicked', ()=> {
				mainContent.lastMessage.getText().should.equal('😀');
			});
		});

		describe('send emoji via text:', ()=> {
			it('it should add emoji text to the message input', ()=> {
				mainContent.addTextToInput(':smile');
			});

			it('it should show the emoji popup bar', ()=> {
				mainContent.messagePopUp.isVisible().should.be.true;
			});

			it('it should be that the emoji popup bar title is emoji', ()=> {
				mainContent.messagePopUpTitle.getText().should.equal('Emoji');
			});

			it('it should show the emoji popup bar items', ()=> {
				mainContent.messagePopUpItems.isVisible().should.be.true;
			});

			it('it should click the first emoji on the popup list', ()=> {
				mainContent.messagePopUpFirstItem.click();
			});

			it('it should be that the value on the message input is the same as the emoji clicked', ()=> {
				mainContent.messageInput.getValue().should.equal(':smile: ');
			});

			it('it should send the emoji', ()=> {
				mainContent.sendBtn.click();
			});

			it('it should be that the value on the message is the same as the emoji clicked', ()=> {
				mainContent.lastMessage.getText().should.equal('😄');
			});
		});
	});

});
