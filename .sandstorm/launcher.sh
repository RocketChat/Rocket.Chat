#!/bin/bash
set -x
set -euvo pipefail

export METEOR_SETTINGS='{"public": {"sandstorm": true}}'
export NODE_ENV=production
export SETTINGS_HIDDEN="Email,Email_Header,Email_Footer,SMTP_Host,SMTP_Port,SMTP_Username,SMTP_Password,From_Email,SMTP_Test_Button,Invitation_Customized,Invitation_Subject,Invitation_HTML,Accounts_Enrollment_Customized,Accounts_Enrollment_Email_Subject,Accounts_Enrollment_Email,Accounts_UserAddedEmail_Customized,Accounts_UserAddedEmailSubject,Accounts_UserAddedEmail,Forgot_Password_Customized,Forgot_Password_Email_Subject,Forgot_Password_Email,Verification_Customized,Verification_Email_Subject,Verification_Email"
exec node /start.js -p 8000
