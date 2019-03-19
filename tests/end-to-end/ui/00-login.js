// import loginPage from '../../pageobjects/login.page';
// import setupWizard from '../../pageobjects/setup-wizard.page';

// describe('[Login]', () => {
// 	before(() => {
// 		loginPage.open();
// 		// This Can Cause Timeouts erros if the server is slow so it should have a big wait
// 		loginPage.emailOrUsernameField.waitForVisible(15000);
// 	});

// 	describe('[Render]', () => {
// 		it('it should show email / username field', () => {
// 			loginPage.emailOrUsernameField.isVisible().should.be.true;
// 		});

// 		it('it should show password field', () => {
// 			loginPage.passwordField.isVisible().should.be.true;
// 		});

// 		it('it should show submit button', () => {
// 			loginPage.submitButton.isVisible().should.be.true;
// 		});

// 		it('it should show register button', () => {
// 			loginPage.registerButton.isVisible().should.be.true;
// 		});

// 		it('it should show forgot password button', () => {
// 			loginPage.forgotPasswordButton.isVisible().should.be.true;
// 		});

// 		it('it should not show name field', () => {
// 			loginPage.nameField.isVisible().should.be.false;
// 		});

// 		it('it should not show email field', () => {
// 			loginPage.emailField.isVisible().should.be.false;
// 		});

// 		it('it should not show confirm password field', () => {
// 			loginPage.confirmPasswordField.isVisible().should.be.false;
// 		});

// 		it('it should not show back to login button', () => {
// 			loginPage.backToLoginButton.isVisible().should.be.false;
// 		});
// 	});

// 	describe('[Required Fields]', () => {
// 		before(() => {
// 			loginPage.submit();
// 		});

// 		describe('email / username: ', () => {
// 			it('it should be required', () => {
// 				loginPage.emailOrUsernameField.getAttribute('class').should.contain('error');
// 				loginPage.emailOrUsernameInvalidText.getText().should.not.be.empty;
// 			});
// 		});

// 		describe('password: ', () => {
// 			it('it should be required', () => {
// 				loginPage.passwordField.getAttribute('class').should.contain('error');
// 				loginPage.passwordInvalidText.getText().should.not.be.empty;
// 			});
// 		});
// 	});
// });

// describe('[Setup Wizard]', () => {
// 	before(() => {
// 		setupWizard.login();
// 		setupWizard.organizationType.waitForVisible(15000);
// 	});

// 	describe('[Render - Step 1]', () => {
// 		it('it should show organization type', () => {
// 			setupWizard.organizationType.isVisible().should.be.true;
// 		});

// 		it('it should show organization name', () => {
// 			setupWizard.organizationName.isVisible().should.be.true;
// 		});

// 		it('it should show industry', () => {
// 			setupWizard.industry.isVisible().should.be.true;
// 		});

// 		it('it should show size', () => {
// 			setupWizard.size.isVisible().should.be.true;
// 		});

// 		it('it should show country', () => {
// 			setupWizard.country.isVisible().should.be.true;
// 		});

// 		it('it should show website', () => {
// 			setupWizard.website.isVisible().should.be.true;
// 		});

// 		after(() => {
// 			setupWizard.goNext();
// 		});
// 	});

// 	describe('[Render - Step 2]', () => {
// 		it('it should show site name', () => {
// 			setupWizard.siteName.isVisible().should.be.true;
// 		});

// 		it('it should show language', () => {
// 			setupWizard.language.isVisible().should.be.true;
// 		});

// 		it('it should server type', () => {
// 			setupWizard.serverType.isVisible().should.be.true;
// 		});

// 		after(() => {
// 			setupWizard.goNext();
// 		});
// 	});

// 	describe('[Render - Step 3]', () => {
// 		it('it should have option for registered server', () => {
// 			setupWizard.registeredServer.isExisting().should.be.true;
// 		});

// 		it('it should have option for standalone server', () => {
// 			setupWizard.standaloneServer.isExisting().should.be.true;
// 		});

// 		it('it should check option for registered server by default', () => {
// 			setupWizard.registeredServer.isSelected().should.be.true;
// 		});

// 		after(() => {
// 			setupWizard.goNext();
// 		});
// 	});

// 	describe('[Render - Final Step]', () => {
// 		it('it should render "Go to your workspace button', () => {
// 			setupWizard.goToWorkspace.waitForVisible(20000);
// 			setupWizard.goToWorkspace.isVisible().should.be.true;
// 		});

// 		after(() => {
// 			setupWizard.goToHome();
// 		});
// 	});

// 	after(() => {
// 		browser.execute(function() {
// 			const user = Meteor.user();
// 			Meteor.logout(() => {
// 				RocketChat.callbacks.run('afterLogoutCleanUp', user);
// 				Meteor.call('logoutCleanUp', user);
// 				FlowRouter.go('home');
// 			});
// 		});
// 	});
// });
