const config = {
  openaiApiKey: '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', // To be filled by user
  userInfo: {
    firstName: 'Aryan',
    lastName: 'Sawhney',
    email: 'aryan_sawhney@brown.edu',
    phone: '401-230-3890',
    address: '69 Brown st.',
    city: 'Providence',
    state: 'RI',
    zipCode: '02912',
    dateOfBirth: '2005-12-12',
  },
  fieldMappings: {}
};

// US States for the dropdown
const states = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

// Populate states dropdown
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM Content Loaded');
  const stateSelect = document.getElementById('state');
  states.forEach(state => {
    const option = document.createElement('option');
    option.value = state;
    option.textContent = state;
    stateSelect.appendChild(option);
  });

  // Load saved information
  loadSavedInfo();
});

// Load saved information from storage
async function loadSavedInfo() {
  try {
    const result = await chrome.storage.local.get(['userInfo', 'openaiApiKey']);
    if (result.userInfo) {
      Object.keys(result.userInfo).forEach(key => {
        const element = document.getElementById(key);
        if (element) {
          element.value = result.userInfo[key];
        }
      });
    }
    if (result.openaiApiKey) {
      document.getElementById('openaiApiKey').value = result.openaiApiKey;
    }
  } catch (error) {
    console.error('Error loading saved information:', error);
  }
}

// Save information to storage
async function saveInfo() {
  const userInfo = {
    firstName: document.getElementById('firstName').value,
    lastName: document.getElementById('lastName').value,
    email: document.getElementById('email').value,
    phone: document.getElementById('phone').value,
    address: document.getElementById('address').value,
    city: document.getElementById('city').value,
    state: document.getElementById('state').value,
    zipCode: document.getElementById('zipCode').value,
    dateOfBirth: document.getElementById('dateOfBirth').value
  };

  const openaiApiKey = document.getElementById('openaiApiKey').value;

  try {
    await chrome.storage.local.set({
      userInfo: userInfo,
      openaiApiKey: openaiApiKey
    });
    
    // Update the config object
    config.userInfo = userInfo;
    config.openaiApiKey = openaiApiKey;

    showStatus('Information saved successfully!', 'success');
  } catch (error) {
    console.error('Error saving information:', error);
    showStatus('Error saving information. Please try again.', 'error');
  }
}

// Function to show status message
function showStatus(message, type) {
  console.log(`Showing status: ${message} (${type})`);
  const status = document.getElementById('status');
  status.textContent = message;
  status.className = type;
  setTimeout(() => {
    status.textContent = '';
    status.className = '';
  }, 3000);
}

// Function to fill the form
async function fillForm() {
  console.log('Fill Form button clicked');
  const fillFormButton = document.getElementById('fillFormButton');
  const status = document.getElementById('status');
  
  try {
    // Disable button and show loading state
    fillFormButton.disabled = true;
    fillFormButton.textContent = 'Filling Form...';
    status.textContent = 'Starting form fill process...';
    status.className = 'info';

    // Get the current active tab
    console.log('Getting current active tab...');
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab) {
      console.error('No active tab found');
      showStatus('No active tab found', 'error');
      return;
    }
    console.log('Current tab:', tab);

    // Verify we're on the correct page
    if (!tab.url.includes('delta.com')) {
      console.error('Not on a Delta website');
      showStatus('Please navigate to a Delta website', 'error');
      return;
    }

    // Send message to content script to fill the form
    console.log('Sending fill form message to content script...');
    status.textContent = 'Analyzing form fields...';
    
    try {
      const response = await chrome.tabs.sendMessage(tab.id, { action: "fillForm" });
      console.log('Response from content script:', response);
      
      if (response && response.status === "completed") {
        console.log('Form fill completed successfully');
        showStatus('Form filled successfully!', 'success');
      } else {
        console.error('Form fill failed or incomplete');
        showStatus('Error filling form', 'error');
      }
    } catch (error) {
      console.error('Error sending message to content script:', error);
      showStatus('Error: Could not communicate with the page. Please refresh and try again.', 'error');
    }
  } catch (error) {
    console.error('Error during form fill:', error);
    showStatus('Error filling form: ' + error.message, 'error');
  } finally {
    // Re-enable button and restore text
    fillFormButton.disabled = false;
    fillFormButton.textContent = 'Fill Form';
  }
}

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM Content Loaded');
  const fillFormButton = document.getElementById('fillFormButton');
  console.log('Fill form button found:', fillFormButton);
  
  if (fillFormButton) {
    fillFormButton.addEventListener('click', fillForm);
    console.log('Click event listener attached to fill form button');
  } else {
    console.error('Fill form button not found in DOM');
  }
});

console.log('Popup.js finished loading'); 
console.log('Popup script loaded and ready'); 