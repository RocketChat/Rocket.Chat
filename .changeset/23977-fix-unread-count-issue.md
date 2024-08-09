---
title: Fix Unread Count Issue
---

Resolved the issue related to incorrect unread message counts in the subscriptions.get route. Adjusted the subscriptions.get, subscriptions.read, and subscriptions.unread routes for improved accuracy. Removed subscriptions.getOne route as it was not contributing to the correct behavior.

Closes #23977
