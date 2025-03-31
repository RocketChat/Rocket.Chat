# Test Plan for Thread Image Upload Fix

## Issue Description
When uploading an image to a thread with "Also send to channel" option enabled, the message is not showing up in the channel.

## Changes Made
1. Modified `uploadFiles.ts` to pass the `tshow` parameter from the thread composer to the upload function
2. Updated `uploads.ts` to include the `tshow` parameter in the type definition and pass it to the server
3. Updated `ChatAPI.ts` to include the `tshow` property in the ComposerAPI and UploadsAPI interfaces
4. Updated the server-side validation in `sendFileMessage.ts` to accept the `tshow` parameter

## Test Steps
1. Open a Rocket.Chat channel
2. Send a message in the channel
3. Click on the message to open the thread view
4. Check the "Also send to channel" option
5. Upload an image to the thread
6. Verify that the image message appears in both the thread and the main channel

## Expected Result
The image message should be visible in both the thread and the main channel when "Also send to channel" is checked.

## Additional Tests
1. Test with "Also send to channel" unchecked - image should only appear in the thread
2. Test with multiple images - all images should appear in both thread and channel when "Also send to channel" is checked
3. Test with different image types (jpg, png, gif) - all should work correctly
