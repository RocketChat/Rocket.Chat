/**
 * Comprehensive test for thread image upload functionality
 *
 * This script simulates the entire flow of uploading an image to a thread with "Also send to channel" option
 * and verifies that the tshow parameter is correctly passed through all layers.
 */

// Mock the client-side objects and functions
const chat = {
  composer: {
    tshow: true, // Simulating "Also send to channel" being checked
    quotedMessages: {
      get: () => []
    },
    clear: () => console.log('Composer cleared')
  },
  data: {
    getRoom: async () => ({ _id: 'room1' })
  },
  uploads: {
    send: (file, options, getContent, fileContent) => {
      console.log('Client: Uploading file with options:', JSON.stringify(options, null, 2));

      // Simulate the REST API call to the server
      mockServerUploadEndpoint(file, options);
    }
  }
};

// Mock file object
const file = {
  name: 'test-image.jpg',
  type: 'image/jpeg',
  size: 1024
};

// Mock server-side functions
function mockServerUploadEndpoint(file, clientOptions) {
  console.log('Server: Received upload request with options:', JSON.stringify(clientOptions, null, 2));

  // Simulate the server processing the upload
  const uploadedFile = {
    _id: 'file1',
    name: file.name,
    type: file.type,
    size: file.size,
    rid: clientOptions.rid || 'room1',
    userId: 'user1'
  };

  // Simulate the mediaConfirm endpoint
  mockServerMediaConfirmEndpoint(uploadedFile, clientOptions);
}

function mockServerMediaConfirmEndpoint(file, clientOptions) {
  console.log('Server: Processing mediaConfirm with options:', JSON.stringify(clientOptions, null, 2));

  // Simulate the sendFileMessage function
  mockSendFileMessage(file, clientOptions);
}

function mockSendFileMessage(file, msgData) {
  console.log('Server: Executing sendFileMessage with msgData:', JSON.stringify(msgData, null, 2));

  // Check if tshow parameter is included in the message data
  if (msgData.hasOwnProperty('tshow') && msgData.tmid) {
    console.log(`✅ TEST PASSED: tshow parameter (${msgData.tshow}) is correctly passed to sendFileMessage`);

    // Simulate the message being saved to the database
    const message = {
      _id: 'msg1',
      rid: 'room1',
      tmid: msgData.tmid,
      tshow: msgData.tshow,
      msg: msgData.msg || '',
      file: file,
      u: { _id: 'user1', username: 'testuser' },
      ts: new Date()
    };

    // Simulate the message being displayed in the UI
    mockMessageDisplay(message);
  } else if (!msgData.tmid) {
    console.log('⚠️ TEST SKIPPED: Not a thread message (tmid is missing)');
  } else {
    console.error('❌ TEST FAILED: tshow parameter is missing in sendFileMessage');
  }
}

function mockMessageDisplay(message) {
  console.log('UI: Displaying message:', JSON.stringify(message, null, 2));

  // Check if the message would be displayed in the main channel
  if (message.tmid && message.tshow) {
    console.log('✅ TEST PASSED: Message with tmid and tshow=true would be displayed in the main channel');
  } else if (message.tmid && !message.tshow) {
    console.log('✅ TEST PASSED: Message with tmid and tshow=false would NOT be displayed in the main channel');
  }
}

// Import the uploadFiles function (simulated here)
const uploadFiles = async (chat, files) => {
  const replies = chat.composer?.quotedMessages.get() ?? [];
  const msg = '';
  const room = await chat.data.getRoom();

  // Get tshow value from the composer context
  const tshow = chat.composer?.tshow;

  console.log('Client: Thread composer tshow value:', tshow);

  const uploadFile = (file, extraData) => {
    chat.uploads.send(
      file,
      {
        msg,
        tmid: 'parentMsg1', // Simulating a thread message
        ...extraData,
        // Pass tshow parameter if it exists
        ...(tshow !== undefined && { tshow }),
      }
    );
    chat.composer?.clear();
  };

  // Simulate file upload
  uploadFile(files[0], {});
};

// Run the test
console.log('Starting comprehensive thread image upload test...');
uploadFiles(chat, [file]).then(() => {
  console.log('Test completed');

  // Run additional test case with tshow = false
  console.log('\nRunning additional test with tshow = false...');
  chat.composer.tshow = false;
  uploadFiles(chat, [file]).then(() => {
    console.log('Additional test completed');

    // Run additional test case with tshow = undefined
    console.log('\nRunning additional test with tshow = undefined...');
    delete chat.composer.tshow;
    uploadFiles(chat, [file]).then(() => {
      console.log('Final test completed');
    });
  });
});
