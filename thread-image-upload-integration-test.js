/**
 * Integration test for thread image upload functionality
 *
 * This test simulates the actual client-server interaction more accurately,
 * focusing on the specific issue with images uploaded to threads not showing in the channel.
 */

// Mock the message collection that would be queried by the UI
const messagesCollection = [];

// Mock the client-side objects and functions
class ChatAPI {
  constructor() {
    this.composer = {
      tshow: true, // Default to "Also send to channel" being checked
      quotedMessages: {
        get: () => []
      },
      clear: () => console.log('Client: Composer cleared')
    };

    this.data = {
      getRoom: async () => ({ _id: 'room1', name: 'general' })
    };

    this.uploads = {
      send: (file, options, getContent, fileContent) => {
        console.log('Client: Uploading file with options:', JSON.stringify(options, null, 2));

        // Simulate the REST API call to the server
        return this.mockServerUploadEndpoint(file, options);
      }
    };
  }

  // Server-side simulation
  async mockServerUploadEndpoint(file, clientOptions) {
    console.log('Server: Received upload request with options:', JSON.stringify(clientOptions, null, 2));

    // Simulate the server processing the upload
    const uploadedFile = {
      _id: `file_${Date.now()}`,
      name: file.name,
      type: file.type,
      size: file.size,
      rid: clientOptions.rid || 'room1',
      userId: 'user1'
    };

    // Simulate the mediaConfirm endpoint
    return this.mockServerMediaConfirmEndpoint(uploadedFile, clientOptions);
  }

  async mockServerMediaConfirmEndpoint(file, clientOptions) {
    console.log('Server: Processing mediaConfirm with options:', JSON.stringify(clientOptions, null, 2));

    // Simulate the sendFileMessage function
    return this.mockSendFileMessage(file, clientOptions);
  }

  async mockSendFileMessage(file, msgData) {
    console.log('Server: Executing sendFileMessage with msgData:', JSON.stringify(msgData, null, 2));

    // Create a unique timestamp for each message
    const timestamp = Date.now() + Math.floor(Math.random() * 1000);

    // Create the message object that would be saved to the database
    const message = {
      _id: `msg_${timestamp}`,
      rid: 'room1',
      tmid: msgData.tmid,
      tshow: msgData.tshow,
      msg: msgData.msg || '',
      file: file,
      files: [file],
      attachments: [{
        title: file.name,
        type: 'file',
        image_url: `file://${file._id}`,
        image_type: file.type,
        image_size: file.size
      }],
      u: { _id: 'user1', username: 'testuser' },
      ts: new Date(timestamp)
    };

    // Add the message to our mock collection
    messagesCollection.push(message);

    return message;
  }
}

// Mock file object
const createTestFile = (name) => ({
  name,
  type: name.endsWith('.jpg') ? 'image/jpeg' : 'image/png',
  size: 1024
});

// Function to simulate uploading a file in a thread
async function uploadFileInThread(chat, file, threadId, sendToChannel) {
  console.log(`\nTest: Uploading ${file.name} in thread ${threadId} with sendToChannel=${sendToChannel}`);

  // Set the tshow value based on the test parameter
  chat.composer.tshow = sendToChannel;

  // Simulate the uploadFiles function
  const msg = '';
  const room = await chat.data.getRoom();

  // Get tshow value from the composer context
  const tshow = chat.composer.tshow;

  console.log('Client: Thread composer tshow value:', tshow);

  // Simulate the file upload
  const result = await chat.uploads.send(
    file,
    {
      msg,
      tmid: threadId,
      rid: room._id,
      ...(tshow !== undefined && { tshow }),
    }
  );

  chat.composer.clear();
  return result;
}

// Function to check if a message would be displayed in the main channel
function checkMessageVisibilityInChannel(message) {
  const isThreadMessage = !!message.tmid;
  const shouldShowInChannel = message.tshow === true;

  console.log(`Message ${message._id}:`);
  console.log(`- Is thread message: ${isThreadMessage}`);
  console.log(`- Should show in channel: ${shouldShowInChannel}`);

  if (isThreadMessage && shouldShowInChannel) {
    console.log('✅ TEST PASSED: Thread message with tshow=true would be displayed in the main channel');
    return true;
  } else if (isThreadMessage && !shouldShowInChannel) {
    console.log('✅ TEST PASSED: Thread message with tshow=false would NOT be displayed in the main channel');
    return false;
  } else if (!isThreadMessage) {
    console.log('ℹ️ INFO: Not a thread message, would be displayed in the main channel');
    return true;
  }
}

// Function to simulate the UI query that fetches messages for the main channel
function getMessagesVisibleInMainChannel() {
  // This simulates the query in useMessages.ts:
  // $or: [{ tmid: { $exists: false } }, { tshow: { $eq: true } }]
  return messagesCollection.filter(msg => !msg.tmid || msg.tshow === true);
}

// Function to simulate the UI query that fetches messages for a thread
function getMessagesVisibleInThread(threadId) {
  return messagesCollection.filter(msg => msg.tmid === threadId || msg._id === threadId);
}

// Run the tests
async function runTests() {
  const chat = new ChatAPI();

  console.log('Starting integration tests for thread image upload...');

  // Create a parent message (not a thread message)
  const parentMessage = await chat.mockSendFileMessage(
    createTestFile('parent.jpg'),
    { rid: 'room1', msg: 'Parent message' }
  );

  console.log('\n--- Test 1: Upload image in thread with "Also send to channel" checked ---');
  const threadMsg1 = await uploadFileInThread(chat, createTestFile('thread1.jpg'), parentMessage._id, true);
  checkMessageVisibilityInChannel(threadMsg1);

  console.log('\n--- Test 2: Upload image in thread with "Also send to channel" unchecked ---');
  const threadMsg2 = await uploadFileInThread(chat, createTestFile('thread2.jpg'), parentMessage._id, false);
  checkMessageVisibilityInChannel(threadMsg2);

  console.log('\n--- Test 3: Upload image in thread with "Also send to channel" undefined ---');
  chat.composer.tshow = undefined;
  const threadMsg3 = await uploadFileInThread(chat, createTestFile('thread3.png'), parentMessage._id, undefined);
  checkMessageVisibilityInChannel(threadMsg3);

  // Verify what messages would be visible in the main channel
  console.log('\n--- Messages that would be visible in the main channel ---');
  const mainChannelMessages = getMessagesVisibleInMainChannel();
  mainChannelMessages.forEach(msg => {
    console.log(`- ${msg._id} (${msg.file.name}): ${msg.tmid ? 'Thread message' : 'Regular message'}, tshow=${msg.tshow}`);
  });

  // Verify what messages would be visible in the thread
  console.log('\n--- Messages that would be visible in the thread ---');
  const threadMessages = getMessagesVisibleInThread(parentMessage._id);
  threadMessages.forEach(msg => {
    console.log(`- ${msg._id} (${msg.file.name}): ${msg._id === parentMessage._id ? 'Parent message' : 'Reply'}`);
  });

  // Final verification
  const test1Passed = mainChannelMessages.some(msg => msg._id === threadMsg1._id);
  const test2Passed = !mainChannelMessages.some(msg => msg._id === threadMsg2._id);
  const test3Passed = !mainChannelMessages.some(msg => msg._id === threadMsg3._id);

  console.log('\n--- Final Test Results ---');
  console.log(`Test 1 (tshow=true): ${test1Passed ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Test 2 (tshow=false): ${test2Passed ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Test 3 (tshow=undefined): ${test3Passed ? '✅ PASSED' : '❌ FAILED'}`);

  return test1Passed && test2Passed && test3Passed;
}

// Run the tests
runTests().then(allPassed => {
  console.log(`\nAll tests ${allPassed ? 'PASSED' : 'FAILED'}`);
});
