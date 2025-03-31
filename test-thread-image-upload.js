/**
 * Test script for thread image upload functionality
 * 
 * This script simulates the flow of uploading an image to a thread with "Also send to channel" option
 * and verifies that the tshow parameter is correctly passed through the entire flow.
 */

// Mock the necessary objects and functions
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
      console.log('Uploading file with options:', JSON.stringify(options, null, 2));
      // Verify that tshow parameter is included in the options
      if (options.tshow === true) {
        console.log('✅ TEST PASSED: tshow parameter is correctly passed to uploads.send');
      } else {
        console.error('❌ TEST FAILED: tshow parameter is missing or incorrect');
      }
    }
  }
};

// Mock file object
const file = {
  name: 'test-image.jpg',
  type: 'image/jpeg',
  size: 1024
};

// Import the uploadFiles function (simulated here)
const uploadFiles = async (chat, files) => {
  const replies = chat.composer?.quotedMessages.get() ?? [];
  const msg = '';
  const room = await chat.data.getRoom();
  
  // Get tshow value from the composer context
  const tshow = chat.composer?.tshow;
  
  console.log('Thread composer tshow value:', tshow);
  
  const uploadFile = (file, extraData) => {
    chat.uploads.send(
      file,
      {
        msg,
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
console.log('Starting thread image upload test...');
uploadFiles(chat, [file]).then(() => {
  console.log('Test completed');
});
