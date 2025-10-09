--- a/packages/@rocket.chat/apps-engine
+++ b/packages/@rocket.chat/apps-engine
@@ -1,4 +1,4 @@
-@rocket.chat/apps-engine: patch
+@rocket.chat/apps-engine: fix(installation)
 
--- a/packages/@rocket.chat/meteor
+++ b/packages/@rocket.chat/meteor
@@ -1,4 +1,4 @@
-@rocket.chat/meteor: patch
+@rocket.chat/meteor: fix(app-state)
 
-Fixes a bug that would cause apps to go into `invalid_installation_disabled` in some cases
+**JIRA/TICKET:** APP-XXXX
+
+**Fix:** Corrects an issue in the app lifecycle management that led to premature or erroneous setting of the `invalid_installation_disabled` state. This ensures app status correctly reflects installation integrity.
