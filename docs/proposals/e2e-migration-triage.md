# E2E migration triage

Generated worklist for the migration plan at [e2e-performance-migration.md](./e2e-performance-migration.md).

Produced by `apps/meteor/tests/e2e/scripts/e2e-triage.mts`. Re-run whenever the spec
surface changes; commit the result.

`ci_median_ms` is intentionally left blank — pull it from the latest Playwright
report on `main` and recompute `priority_score` (`ci_median_ms * (is_serial + ui_setup_hits)`)
before picking a batch. Until then, rows are sorted by `(is_serial * 5) + ui_setup_hits`
as a rough stand-in.

- Total specs: 152
- Candidates for Phase 2: 144
- Opt-out: 8
- Serial suites: 63
- Specs with at least one UI setup hit: 9

## Phase 2 candidates

Sorted by the stand-in priority until `ci_median_ms` is populated.

| path | is_serial | ui_setup_hits | ci_median_ms | priority_score |
| --- | :-: | --: | --: | --: |
| `report-message.spec.ts` | yes | 8 | — | — |
| `messaging.spec.ts` | yes | 2 | — | — |
| `feature-preview.spec.ts` | yes | 1 | — | — |
| `image-gallery.spec.ts` | yes | 1 | — | — |
| `quote-messages.spec.ts` | yes | 1 | — | — |
| `threads.spec.ts` | yes | 1 | — | — |
| `account-profile.spec.ts` | yes | 0 | — | — |
| `account-security.spec.ts` | yes | 0 | — | — |
| `admin-room.spec.ts` | yes | 0 | — | — |
| `admin-users-status-management.spec.ts` | yes | 0 | — | — |
| `administration.spec.ts` | yes | 0 | — | — |
| `apps/apps-contextualbar.spec.ts` | yes | 0 | — | — |
| `apps/apps-modal.spec.ts` | yes | 0 | — | — |
| `apps/private-apps-upload.spec.ts` | yes | 0 | — | — |
| `e2e-encryption/e2ee-passphrase-management.spec.ts` | yes | 0 | — | — |
| `email-inboxes.spec.ts` | yes | 0 | — | — |
| `emojis.spec.ts` | yes | 0 | — | — |
| `file-upload.spec.ts` | yes | 0 | — | — |
| `files-management.spec.ts` | yes | 0 | — | — |
| `global-search.spec.ts` | yes | 0 | — | — |
| `homepage.spec.ts` | yes | 0 | — | — |
| `imports.spec.ts` | yes | 0 | — | — |
| `jump-to-thread-message.spec.ts` | yes | 0 | — | — |
| `mark-unread.spec.ts` | yes | 0 | — | — |
| `message-actions.spec.ts` | yes | 0 | — | — |
| `message-composer.spec.ts` | yes | 0 | — | — |
| `message-mentions.spec.ts` | yes | 0 | — | — |
| `messaging-scroll-to-bottom.spec.ts` | yes | 0 | — | — |
| `notification-sounds.spec.ts` | yes | 0 | — | — |
| `omnichannel/omnichannel-agents.spec.ts` | yes | 0 | — | — |
| `omnichannel/omnichannel-appearance.spec.ts` | yes | 0 | — | — |
| `omnichannel/omnichannel-canned-responses-sidebar.spec.ts` | yes | 0 | — | — |
| `omnichannel/omnichannel-changing-room-priority-and-sla.spec.ts` | yes | 0 | — | — |
| `omnichannel/omnichannel-contact-conflict-review.spec.ts` | yes | 0 | — | — |
| `omnichannel/omnichannel-custom-field-usage.spec.ts` | yes | 0 | — | — |
| `omnichannel/omnichannel-departaments-ce.spec.ts` | yes | 0 | — | — |
| `omnichannel/omnichannel-livechat-typing-indicator.spec.ts` | yes | 0 | — | — |
| `omnichannel/omnichannel-livechat.spec.ts` | yes | 0 | — | — |
| `omnichannel/omnichannel-manager.spec.ts` | yes | 0 | — | — |
| `omnichannel/omnichannel-monitor-department.spec.ts` | yes | 0 | — | — |
| `omnichannel/omnichannel-monitors.spec.ts` | yes | 0 | — | — |
| `omnichannel/omnichannel-priorities-sidebar.spec.ts` | yes | 0 | — | — |
| `omnichannel/omnichannel-priorities.spec.ts` | yes | 0 | — | — |
| `omnichannel/omnichannel-reports.spec.ts` | yes | 0 | — | — |
| `omnichannel/omnichannel-triggers.spec.ts` | yes | 0 | — | — |
| `permissions.spec.ts` | yes | 0 | — | — |
| `presence.spec.ts` | yes | 0 | — | — |
| `read-receipts-deactivated-users.spec.ts` | yes | 0 | — | — |
| `read-receipts.spec.ts` | yes | 0 | — | — |
| `retention-policy.spec.ts` | yes | 0 | — | — |
| `search-discussion.spec.ts` | yes | 0 | — | — |
| `settings-assets.spec.ts` | yes | 0 | — | — |
| `settings-int.spec.ts` | yes | 0 | — | — |
| `settings-persistence-on-ui-navigation.spec.ts` | yes | 0 | — | — |
| `sidebar-administration-menu.spec.ts` | yes | 0 | — | — |
| `sidebar.spec.ts` | yes | 0 | — | — |
| `system-messages.spec.ts` | yes | 0 | — | — |
| `team-management.spec.ts` | yes | 0 | — | — |
| `omnichannel/omnichannel-canned-responses-usage.spec.ts` | no | 1 | — | — |
| `omnichannel/omnichannel-livechat-message-bubble-color.spec.ts` | no | 1 | — | — |
| `quote-attachment.spec.ts` | no | 1 | — | — |
| `admin-device-management.spec.ts` | no | 0 | — | — |
| `admin-users-custom-fields.spec.ts` | no | 0 | — | — |
| `admin-users-role-management.spec.ts` | no | 0 | — | — |
| `admin-users.spec.ts` | no | 0 | — | — |
| `administration-settings.spec.ts` | no | 0 | — | — |
| `anonymous-user.spec.ts` | no | 0 | — | — |
| `apps/app-modal-interaction.spec.ts` | no | 0 | — | — |
| `calendar.spec.ts` | no | 0 | — | — |
| `delete-account.spec.ts` | no | 0 | — | — |
| `e2e-encryption/e2ee-encrypted-channels.spec.ts` | no | 0 | — | — |
| `e2e-encryption/e2ee-encryption-decryption.spec.ts` | no | 0 | — | — |
| `e2e-encryption/e2ee-file-encryption.spec.ts` | no | 0 | — | — |
| `e2e-encryption/e2ee-key-reset.spec.ts` | no | 0 | — | — |
| `e2e-encryption/e2ee-legacy-format.spec.ts` | no | 0 | — | — |
| `e2e-encryption/e2ee-pdf-export.spec.ts` | no | 0 | — | — |
| `e2e-encryption/e2ee-server-settings.spec.ts` | no | 0 | — | — |
| `embedded-layout.spec.ts` | no | 0 | — | — |
| `export-messages.spec.ts` | no | 0 | — | — |
| `forgot-password.spec.ts` | no | 0 | — | — |
| `iframe-authentication.spec.ts` | no | 0 | — | — |
| `image-upload.spec.ts` | no | 0 | — | — |
| `login.spec.ts` | no | 0 | — | — |
| `oauth.spec.ts` | no | 0 | — | — |
| `omnichannel/omnichannel-assign-room-tags.spec.ts` | no | 0 | — | — |
| `omnichannel/omnichannel-auto-onhold-chat-closing.spec.ts` | no | 0 | — | — |
| `omnichannel/omnichannel-auto-transfer-unanswered-chat.spec.ts` | no | 0 | — | — |
| `omnichannel/omnichannel-business-hours.spec.ts` | no | 0 | — | — |
| `omnichannel/omnichannel-chat-history.spec.ts` | no | 0 | — | — |
| `omnichannel/omnichannel-chat-transfers.spec.ts` | no | 0 | — | — |
| `omnichannel/omnichannel-close-chat.spec.ts` | no | 0 | — | — |
| `omnichannel/omnichannel-close-inquiry.spec.ts` | no | 0 | — | — |
| `omnichannel/omnichannel-contact-center-chats-filters.spec.ts` | no | 0 | — | — |
| `omnichannel/omnichannel-contact-center-chats.spec.ts` | no | 0 | — | — |
| `omnichannel/omnichannel-contact-center-contacts.spec.ts` | no | 0 | — | — |
| `omnichannel/omnichannel-contact-center-filters.spec.ts` | no | 0 | — | — |
| `omnichannel/omnichannel-contact-info.spec.ts` | no | 0 | — | — |
| `omnichannel/omnichannel-contact-unknown-callout.spec.ts` | no | 0 | — | — |
| `omnichannel/omnichannel-custom-fields.spec.ts` | no | 0 | — | — |
| `omnichannel/omnichannel-departaments.spec.ts` | no | 0 | — | — |
| `omnichannel/omnichannel-enterprise-menus-logout.spec.ts` | no | 0 | — | — |
| `omnichannel/omnichannel-livechat-agent-idle-setting.spec.ts` | no | 0 | — | — |
| `omnichannel/omnichannel-livechat-api.spec.ts` | no | 0 | — | — |
| `omnichannel/omnichannel-livechat-avatar-visibility.spec.ts` | no | 0 | — | — |
| `omnichannel/omnichannel-livechat-background.spec.ts` | no | 0 | — | — |
| `omnichannel/omnichannel-livechat-department.spec.ts` | no | 0 | — | — |
| `omnichannel/omnichannel-livechat-fileupload.spec.ts` | no | 0 | — | — |
| `omnichannel/omnichannel-livechat-hide-expand-chat.spec.ts` | no | 0 | — | — |
| `omnichannel/omnichannel-livechat-logo.spec.ts` | no | 0 | — | — |
| `omnichannel/omnichannel-livechat-queue-management-autoselection.spec.ts` | no | 0 | — | — |
| `omnichannel/omnichannel-livechat-queue-management.spec.ts` | no | 0 | — | — |
| `omnichannel/omnichannel-livechat-tab-communication.spec.ts` | no | 0 | — | — |
| `omnichannel/omnichannel-livechat-watermark.spec.ts` | no | 0 | — | — |
| `omnichannel/omnichannel-livechat-widget.spec.ts` | no | 0 | — | — |
| `omnichannel/omnichannel-manager-role.spec.ts` | no | 0 | — | — |
| `omnichannel/omnichannel-manual-selection-logout.spec.ts` | no | 0 | — | — |
| `omnichannel/omnichannel-manual-selection.spec.ts` | no | 0 | — | — |
| `omnichannel/omnichannel-monitor-role.spec.ts` | no | 0 | — | — |
| `omnichannel/omnichannel-rooms-forward.spec.ts` | no | 0 | — | — |
| `omnichannel/omnichannel-send-pdf-transcript.spec.ts` | no | 0 | — | — |
| `omnichannel/omnichannel-send-transcript.spec.ts` | no | 0 | — | — |
| `omnichannel/omnichannel-sla-policies-sidebar.spec.ts` | no | 0 | — | — |
| `omnichannel/omnichannel-sla-policies.spec.ts` | no | 0 | — | — |
| `omnichannel/omnichannel-tags.spec.ts` | no | 0 | — | — |
| `omnichannel/omnichannel-takeChat.spec.ts` | no | 0 | — | — |
| `omnichannel/omnichannel-transfer-to-another-agents.spec.ts` | no | 0 | — | — |
| `omnichannel/omnichannel-triggers-after-registration.spec.ts` | no | 0 | — | — |
| `omnichannel/omnichannel-triggers-open-by-visitor.spec.ts` | no | 0 | — | — |
| `omnichannel/omnichannel-triggers-setDepartment.spec.ts` | no | 0 | — | — |
| `omnichannel/omnichannel-triggers-time-on-site.spec.ts` | no | 0 | — | — |
| `omnichannel/omnichannel-units.spec.ts` | no | 0 | — | — |
| `preview-public-channel.spec.ts` | no | 0 | — | — |
| `prune-messages.spec.ts` | no | 0 | — | — |
| `register.spec.ts` | no | 0 | — | — |
| `reset-password.spec.ts` | no | 0 | — | — |
| `saml.spec.ts` | no | 0 | — | — |
| `sidebar-menu.spec.ts` | no | 0 | — | — |
| `translations.spec.ts` | no | 0 | — | — |
| `user-card-info-actions-by-member.spec.ts` | no | 0 | — | — |
| `user-card-info-actions-by-room-owner.spec.ts` | no | 0 | — | — |
| `user-required-password-change.spec.ts` | no | 0 | — | — |
| `video-conference-ring.spec.ts` | no | 0 | — | — |
| `video-conference.spec.ts` | no | 0 | — | — |
| `voice-calls-ee.spec.ts` | no | 0 | — | — |

## Opt-out

Specs the plan explicitly excludes from the migration. See Phase 1 of
[e2e-performance-migration.md](./e2e-performance-migration.md) for the rationale.

| path | reason |
| --- | --- |
| `account-forgetSessionOnWindowClose.spec.ts` | auth/session suite |
| `account-login.spec.ts` | auth/session suite |
| `account-manage-devices.spec.ts` | auth/session suite |
| `channel-management.spec.ts` | subject includes create flows |
| `create-channel.spec.ts` | subject is creation UI |
| `create-direct.spec.ts` | subject is creation UI |
| `create-discussion.spec.ts` | subject is creation UI |
| `enforce-2FA.spec.ts` | auth/session suite |
