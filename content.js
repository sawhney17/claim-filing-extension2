// Immediate logging to verify script loading
console.log('Content script is being loaded...');

const config = {
  openaiApiKey: '',
  userInfo: {
    firstName: 'Aryan',
    lastName: 'Sawhney',
    email: 'aryan_sawhney@brown.edu',
    phone: '401-230-3890',
    address: '69 Brown st.',
    state: 'RI',
    zipCode: '02912',
    dateOfBirth: '2005-12-12',
    skymiles_number: '9679636986',
    confirmation_number: 'HMAM3I',
    departureCity: 'PVD',
    arrivalCity: 'SJC',
    dateOfDerpatreu: '03/20/2025'
  }
};

console.log('Content script fully loaded with config:', config);
// Function to handle date selectors and other custom dropdown elements
async function handleCustomDropdown(field, value) {
  console.log(`Handling custom dropdown for ${field} with value ${value}`);
  
  // Find dropdown based on field name or text content
  const possibleSelectors = [
    `[id="${field}"]`,
    `.mach-select__wrapper:has(.mach-select__title:contains("${field}"))`,
    `.mach-select__wrapper:has(.mach-select__title:contains("Date of ${field}"))`,
    `.mach-select__wrapper:has(.mach-select__title:contains("${field} Date"))`,
    `.mach-select__wrapper:has([aria-label*="${field}"])`,
    `.mach-select__trigger:contains("${field}")`,
    `.mach-select`,
    `[aria-label*="date" i]`,
    `[aria-label*="${field}" i]`
  ];
  
  let dropdownElement = null;
  
  // Try to find the dropdown element using various selectors
  for (const selector of possibleSelectors) {
    try {
      const elements = document.querySelectorAll(selector);
      if (elements && elements.length > 0) {
        // For date fields, try to match "Departure" or "Arrival" in the label
        if (field.toLowerCase().includes('departure')) {
          // Find the first element that mentions departure
          for (const el of elements) {
            if (el.textContent.toLowerCase().includes('departure')) {
              dropdownElement = el;
              break;
            }
          }
          // If no specific match, use the first element
          if (!dropdownElement) dropdownElement = elements[0];
        } else if (field.toLowerCase().includes('arrival')) {
          // Find the first element that mentions arrival
          for (const el of elements) {
            if (el.textContent.toLowerCase().includes('arrival')) {
              dropdownElement = el;
              break;
            }
          }
          // If no specific match, use the second element if available, otherwise first
          if (!dropdownElement) dropdownElement = elements.length > 1 ? elements[1] : elements[0];
        } else {
          // For other fields, use the first matching element
          dropdownElement = elements[0];
        }
        
        if (dropdownElement) break;
      }
    } catch (e) {
      console.log(`Error with selector ${selector}:`, e);
    }
  }
  
  if (!dropdownElement) {
    console.log(`Could not find dropdown element for ${field}`);
    return false;
  }
  
  console.log(`Found dropdown element for ${field}:`, dropdownElement);
  
  // Click the dropdown to open it
  dropdownElement.click();
  await new Promise(resolve => setTimeout(resolve, 500)); // Wait for dropdown to open
  
  // For date fields, handle differently based on the calendar UI that appears
  if (field.toLowerCase().includes('date')) {
    // Try to find a date input within the opened dropdown
    const dateInput = document.querySelector('.calendar-input, input[type="date"], input[placeholder*="date" i], input[aria-label*="date" i]');
    
    if (dateInput) {
      console.log(`Found date input, entering value: ${value}`);
      dateInput.value = value;
      dateInput.dispatchEvent(new Event('input', { bubbles: true }));
      dateInput.dispatchEvent(new Event('change', { bubbles: true }));
      
      // Press Enter to confirm
      const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
        bubbles: true
      });
      dateInput.dispatchEvent(enterEvent);
    } else {
      // If no input field, try clicking on the date directly
      // Parse the date value
      let dateObj;
      try {
        if (value.includes('/')) {
          // MM/DD/YYYY format
          const [month, day, year] = value.split('/');
          dateObj = new Date(year, month - 1, day);
        } else {
          // YYYY-MM-DD format
          dateObj = new Date(value);
        }
        
        // Format as different possible date strings that might appear in the UI
        const day = dateObj.getDate();
        const fullDateStr = dateObj.toLocaleDateString();
        
        // Try to find and click on the date
        const dateSelectors = [
          `[aria-label="${fullDateStr}"]`,
          `[data-date="${value}"]`,
          `[data-value="${value}"]`,
          `.calendar-day:contains("${day}")`,
          `.date-${day}`,
          `[aria-label*="${day}"]`,
        ];
        
        let dateElement = null;
        for (const selector of dateSelectors) {
          try {
            const element = document.querySelector(selector);
            if (element) {
              dateElement = element;
              break;
            }
          } catch (e) {
            console.log(`Error with date selector ${selector}:`, e);
          }
        }
        
        if (dateElement) {
          console.log(`Clicking on date element:`, dateElement);
          dateElement.click();
        } else {
          console.log(`Could not find specific date element for ${value}`);
          // Try to set text directly as a fallback
          dropdownElement.querySelector('.mach-select__trigger__placeholder').textContent = value;
        }
      } catch (e) {
        console.error(`Error parsing date ${value}:`, e);
      }
    }
  } else {
    // For non-date dropdowns, try to find and click on the option with matching text
    const options = document.querySelectorAll('.mach-select__option, .dropdown-item, .dropdown-option, .select-option, li[role="option"]');
    let optionClicked = false;
    
    for (const option of options) {
      if (option.textContent.trim().toLowerCase().includes(value.toLowerCase())) {
        console.log(`Clicking on option:`, option);
        option.click();
        optionClicked = true;
        break;
      }
    }
    
    if (!optionClicked) {
      console.log(`Could not find matching option for ${value}`);
      // Try to set text directly as a fallback
      const placeholderElement = dropdownElement.querySelector('.mach-select__trigger__placeholder');
      if (placeholderElement) {
        placeholderElement.textContent = value;
      }
    }
  }
  
  // If dropdown is still open, click outside to close it
  await new Promise(resolve => setTimeout(resolve, 500));
  document.body.click();
  
  return true;
}

// Function to collect all form elements and their attributes
function collectFormElements() {
  console.log('Collecting form elements...');
  
  // Array to store all collected elements
  const allElements = [];
  
  // 1. Collect standard form elements
  const standardFormElements = document.querySelectorAll('input, select, textarea');
  console.log(`Found ${standardFormElements.length} standard form elements`);
  
  // 2. Collect custom dropdown elements
  const customDropdowns = document.querySelectorAll('.mach-select, [role="combobox"], .travel-info-user-details__input__select, .dropdown-select');
  console.log(`Found ${customDropdowns.length} custom dropdown elements`);
  
  // 3. Collect predictive search elements
  const predictiveSearches = document.querySelectorAll('mach-predictive-search, .predictive-search');
  console.log(`Found ${predictiveSearches.length} predictive search elements`);
  
  // Process standard form elements
  Array.from(standardFormElements).forEach(element => {
    processElement(element, allElements);
  });
  
  // Process custom dropdowns
  Array.from(customDropdowns).forEach(element => {
    processCustomDropdown(element, allElements);
  });
  
  // Process predictive searches
  Array.from(predictiveSearches).forEach(element => {
    processPredictiveSearch(element, allElements);
  });
  
  console.log('Found form elements:', allElements);
  return allElements;
}

// Helper function to process a standard form element
function processElement(element, allElements) {
  // Get all possible labels
  const labels = Array.from(element.labels || []);
  const labelTexts = labels.map(label => label.textContent.trim());
  
  // Get parent container and its text content
  const parentContainer = element.closest('.predictive-search, .form-group, .input-group');
  const parentText = parentContainer ? parentContainer.textContent.trim() : '';
  
  // Get previous sibling text (often contains the field label)
  const prevSibling = element.previousElementSibling;
  const prevSiblingText = prevSibling ? prevSibling.textContent.trim() : '';
  
  // Get aria-label and aria-labelledby
  const ariaLabel = element.getAttribute('aria-label');
  const ariaLabelledby = element.getAttribute('aria-labelledby');
  let ariaLabelText = '';
  if (ariaLabelledby) {
    const labelElement = document.getElementById(ariaLabelledby);
    ariaLabelText = labelElement ? labelElement.textContent.trim() : '';
  }

  // Get placeholder and title
  const placeholder = element.placeholder;
  const title = element.title;

  // Get the element's role and type
  const role = element.getAttribute('role');
  const type = element.type;

  // Get any data attributes
  const dataAttributes = Object.fromEntries(
    Array.from(element.attributes)
      .filter(attr => attr.name.startsWith('data-'))
      .map(attr => [attr.name, attr.value])
  );

  // Combine all text content for context
  const contextText = [
    ...labelTexts,
    parentText,
    prevSiblingText,
    ariaLabel,
    ariaLabelText,
    placeholder,
    title
  ].filter(Boolean).join(' ');

  const elementInfo = {
    type,
    name: element.name,
    id: element.id,
    placeholder,
    label: labelTexts.join(', '),
    required: element.required,
    value: element.value,
    className: element.className,
    role,
    // Context information
    context: {
      labels: labelTexts,
      parentText,
      prevSiblingText,
      ariaLabel,
      ariaLabelText,
      placeholder,
      title,
      combinedContext: contextText
    },
    // Parent form or container for context
    parentForm: element.closest('form')?.id || element.closest('form')?.className || '',
    // Get any data attributes
    dataAttributes
  };

  console.log('Form element found:', elementInfo);
  allElements.push(elementInfo);
}

// Helper function to process a custom dropdown
function processCustomDropdown(element, allElements) {
  // Get ID and other attributes
  const id = element.id;
  const ariaLabel = element.getAttribute('aria-label');
  const role = element.getAttribute('role');
  
  // Look for title or label text
  let titleElement = element.querySelector('.mach-select__title, .dropdown-title, .select-title');
  let title = titleElement ? titleElement.textContent.trim() : '';
  
  // Get the current value
  let valueElement = element.querySelector('.mach-select__trigger__placeholder, .dropdown-value, .select-value');
  let value = valueElement ? valueElement.textContent.trim() : '';
  
  // Get parent container for more context
  const parentContainer = element.closest('.travel-info-user-details__input, .form-group, .input-container');
  const parentText = parentContainer ? parentContainer.textContent.trim() : '';
  
  // Extract more meaningful information from context
  let fieldName = title || ariaLabel || '';
  if (!fieldName && parentText) {
    // Try to extract field name from parent text
    const dateMatch = parentText.match(/Date\s+of\s+(\w+)/i);
    if (dateMatch) {
      fieldName = `Date of ${dateMatch[1]}`;
    } else {
      // Just use the first few words
      fieldName = parentText.split(/\s+/).slice(0, 3).join(' ');
    }
  }
  
  // Special handling for date fields
  if (title.toLowerCase().includes('date') || parentText.toLowerCase().includes('date')) {
    const dateType = title.toLowerCase().includes('departure') || parentText.toLowerCase().includes('departure') 
      ? 'departureDate' 
      : title.toLowerCase().includes('arrival') || parentText.toLowerCase().includes('arrival')
        ? 'arrivalDate'
        : 'date';
        
    const customFieldName = dateType === 'date' ? 'dateOfDeparture' : dateType;
    
    const elementInfo = {
      type: 'dropdown',
      name: customFieldName,
      id: id || customFieldName,
      elementType: 'custom-dropdown',
      label: title,
      value: value,
      role: role,
      context: {
        label: title,
        parentText: parentText,
        ariaLabel: ariaLabel,
        combinedContext: `${title} ${parentText} ${ariaLabel}`.trim()
      },
      isDateField: true,
      dateType: dateType
    };
    
    console.log('Custom date dropdown found:', elementInfo);
    allElements.push(elementInfo);
    return;
  }
  
  // For non-date fields
  const elementInfo = {
    type: 'dropdown',
    name: id || fieldName.toLowerCase().replace(/\s+/g, '_'),
    id: id,
    elementType: 'custom-dropdown',
    label: title,
    value: value,
    role: role,
    context: {
      label: title,
      parentText: parentText,
      ariaLabel: ariaLabel,
      combinedContext: `${title} ${parentText} ${ariaLabel}`.trim()
    }
  };
  
  console.log('Custom dropdown found:', elementInfo);
  allElements.push(elementInfo);
}

// Helper function to process a predictive search
function processPredictiveSearch(element, allElements) {
  // Get ID and type
  const id = element.id;
  
  // Determine if this is departure or arrival based on ID or context
  let searchType = '';
  if (id) {
    if (id.toLowerCase().includes('departure')) {
      searchType = 'departureCity';
    } else if (id.toLowerCase().includes('arrival')) {
      searchType = 'arrivalCity';
    }
  }
  
  // If type not determined by ID, try to find it from content
  if (!searchType) {
    const content = element.textContent.toLowerCase();
    if (content.includes('departure')) {
      searchType = 'departureCity';
    } else if (content.includes('arrival')) {
      searchType = 'arrivalCity';
    } else {
      // Default to generic search type
      searchType = 'predictive_search';
    }
  }
  
  // Get the input field inside
  const input = element.querySelector('input');
  const inputId = input ? input.id : '';
  const inputValue = input ? input.value : '';
  
  // Get label text if any
  const labelElement = element.querySelector('label');
  const labelText = labelElement ? labelElement.textContent.trim() : '';
  
  // Get parent container for more context
  const parentContainer = element.closest('.travel-info-user-details__input, .form-group, .input-container');
  const parentText = parentContainer ? parentContainer.textContent.trim() : '';
  
  const elementInfo = {
    type: 'predictive-search',
    name: id || searchType,
    id: id,
    inputId: inputId,
    elementType: 'predictive-search',
    label: labelText,
    value: inputValue,
    context: {
      label: labelText,
      parentText: parentText,
      combinedContext: `${labelText} ${parentText}`.trim()
    },
    searchType: searchType
  };
  
  console.log('Predictive search found:', elementInfo);
  allElements.push(elementInfo);
}

// Function to transform field values based on mapping
function transformFieldValue(value, fieldName) {
  console.log(`Transforming field value for ${fieldName}: ${value}`);
  
  // Handle special cases
  switch (fieldName) {
    case 'skymiles_number':
      // Convert phone number to just digits for skymiles
      return value.replace(/\D/g, '');
    case 'confirmation_number':
      // Use email as confirmation number
      return value;
    case 'fromCity':
    case 'toCity':
    case 'arrivalCity':
      // Use city for all city-related fields
      return config.userInfo.city;
    default:
      // Handle date fields
      if (fieldName.toLowerCase().includes('date')) {
        // Check if the value is in YYYY-MM-DD format
        if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
          // Convert to MM/DD/YYYY format
          const [year, month, day] = value.split('-');
          return `${month}/${day}/${year}`;
        }
      }
      return value;
  }
}

// Function to wait for an element to appear
async function waitForElement(selector, timeout = 5000) {
  console.log(`Waiting for element: ${selector}`);
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const element = document.querySelector(selector);
    if (element) {
      console.log(`Found element: ${selector}`);
      return element;
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  console.log(`Timeout waiting for element: ${selector}`);
  return null;
}

// Function to simulate typing in an input
async function simulateTyping(input, text) {
  console.log(`Simulating typing: ${text}`);
  for (let i = 0; i < text.length; i++) {
    input.value = text.substring(0, i + 1);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise(resolve => setTimeout(resolve, 100)); // Wait between keystrokes
  }
}

// Function to dismiss dropdown
async function dismissDropdown() {
  console.log('Dismissing dropdown...');
  // Try pressing Escape key
  const escapeEvent = new KeyboardEvent('keydown', {
    key: 'Escape',
    code: 'Escape',
    keyCode: 27,
    which: 27,
    bubbles: true
  });
  document.dispatchEvent(escapeEvent);
  
  // Also try clicking outside
  const clickEvent = new MouseEvent('click', {
    bubbles: true,
    cancelable: true,
    view: window
  });
  document.body.dispatchEvent(clickEvent);
  
  // Wait a moment for the dropdown to disappear
  await new Promise(resolve => setTimeout(resolve, 500));
}

// Function to handle Delta Airlines predictive search
async function handleDeltaPredictiveSearch(field, value) {
  console.log(`Handling Delta predictive search for ${field} with value ${value}`);
  
  // Find the parent container element by ID
  let container = document.querySelector(`mach-predictive-search[id="${field}"]`);
  let input = null;
  
  if (container) {
    // If we found a container with the specific ID
    input = container.querySelector('input[autocomplete="off"]');
    console.log(`Found input through container for ${field}`);
  } else {
    // If no container with that ID, find all predictive search inputs
    const inputs = document.querySelectorAll('input[autocomplete="off"][id^="predictive_search_"]');
    console.log(`Found ${inputs.length} predictive search inputs`);
    
    if (inputs.length === 0) {
      // If no predictive search inputs found, try other input types
      const allInputs = document.querySelectorAll('input[autocomplete="off"]');
      console.log(`Found ${allInputs.length} autocomplete="off" inputs`);
      
      if (allInputs.length === 0) {
        console.log(`Could not find any appropriate inputs`);
        return false;
      }
      
      // Determine which input to use
      if (field.toLowerCase().includes('departure')) {
        input = allInputs[0]; // First match for departure
      } else if (field.toLowerCase().includes('arrival')) {
        input = allInputs.length > 1 ? allInputs[1] : null; // Second match for arrival
      }
    } else {
      // Determine which input to use based on field
      if (field.toLowerCase().includes('departure')) {
        input = inputs[0]; // First match for departure
      } else if (field.toLowerCase().includes('arrival')) {
        input = inputs.length > 1 ? inputs[1] : null; // Second match for arrival
      }
    }
  }
  
  if (!input) {
    console.log(`Could not find input for ${field}`);
    return false;
  }
  
  console.log(`Using input for ${field}:`, input);
  
  // Clear existing value
  input.value = '';
  
  // Fill the input with the value
  console.log(`Typing value: ${value}`);
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
  
  // Give some time for the dropdown to appear and then simulate pressing Enter
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Simulate pressing Enter to select the top result
  const enterEvent = new KeyboardEvent('keydown', {
    key: 'Enter',
    code: 'Enter',
    keyCode: 13,
    which: 13,
    bubbles: true
  });
  input.dispatchEvent(enterEvent);
  
  return true;
}

// Function to fill form elements based on OpenAI's mapping
async function fillFormElements(mapping) {
  console.log('Filling form elements with mapping:', mapping);
  
  for (const [field, userInfoField] of Object.entries(mapping)) {
    console.log(`Processing field: ${field} -> ${userInfoField}`);
    
    // Get the value from userInfo
    const value = config.userInfo[userInfoField];
    if (!value) {
      console.log(`No value found in userInfo for field: ${userInfoField}`);
      continue;
    }

    // Transform the value if needed
    const transformedValue = transformFieldValue(value, field);
    
    // Handle special case for fields with _2 suffix (for second occurrence)
    if (field.endsWith('_2')) {
      const baseField = field.replace('_2', '');
      console.log(`This is a second occurrence field (${baseField})`);
      
      // For predictive search fields, treat this as the arrival city
      if (baseField.startsWith('predictive_search')) {
        console.log(`Handling arrival city predictive search`);
        await handleDeltaPredictiveSearch('arrivalCity', transformedValue);
        continue;
      }
      
      // For other fields, get all elements that match and pick the second one
      const elements = document.querySelectorAll(`[id="${baseField}"],[name="${baseField}"]`);
      if (elements.length >= 2) {
        const element = elements[1]; // Use the second occurrence
        console.log(`Filling second occurrence of ${baseField} with value ${transformedValue}`);
        element.value = transformedValue;
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
        continue;
      }
    }
    
    // Check if this is a custom dropdown (date selector, etc.)
    if (field.toLowerCase().includes('date') || 
        field.toLowerCase().includes('select') ||
        field.toLowerCase().includes('dropdown')) {
      console.log(`Treating ${field} as a custom dropdown`);
      await handleCustomDropdown(field, transformedValue);
      continue;
    }
    
    // Check if this is a Delta Airlines predictive search field
    if (field.toLowerCase().includes('city') || 
        field.toLowerCase().includes('airport') || 
        field.startsWith('predictive_search')) {
      console.log(`Handling predictive search for ${field}`);
      // If it's the first predictive_search field, treat as departure
      const searchType = field.startsWith('predictive_search') && !field.endsWith('_2') ? 
                         'departureCity' : userInfoField;
      await handleDeltaPredictiveSearch(searchType, transformedValue);
      continue;
    }
    
    // Try different selectors to find the element
    const selectors = [
      `[name="${field}"]`,
      `[id="${field}"]`,
      `[data-field="${field}"]`,
      `[aria-label*="${field}"]`,
    ];

    let element = null;
    for (const selector of selectors) {
      element = document.querySelector(selector);
      if (element) break;
    }

    if (element) {
      console.log(`Filling field ${field} with value ${transformedValue}`);
      element.value = transformedValue;
      // Trigger input event to ensure form validation works
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      console.log(`Could not find element for field ${field} using any selector`);
      
      // Last resort: try to find any element containing the field name in text
      const textMatch = document.evaluate(
        `//*[contains(text(), '${field}') or contains(text(), '${field.replace(/_/g, ' ')}')]`,
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      ).singleNodeValue;
      
      if (textMatch) {
        console.log(`Found element by text content for ${field}`);
        const parentControl = textMatch.closest('.form-control, .input-container, .mach-select');
        if (parentControl) {
          // Try to find input within this control
          const input = parentControl.querySelector('input, select, textarea');
          if (input) {
            console.log(`Filling input found via text match: ${field} with value ${transformedValue}`);
            input.value = transformedValue;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
          } else {
            // Try handling as a custom dropdown
            console.log(`Treating text match as possible custom dropdown`);
            await handleCustomDropdown(field, transformedValue);
          }
        }
      }
    }
  }
}

// Function to clean JSON string from markdown formatting
function cleanJsonString(jsonStr) {
  // Remove markdown code block formatting if present
  jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
  // Remove any leading/trailing whitespace
  jsonStr = jsonStr.trim();
  return jsonStr;
}

// Function to analyze form with OpenAI
async function analyzeFormWithOpenAI(formElements) {
  console.log('Analyzing form with OpenAI...');
  
  try {
    console.log(formElements)
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.openaiApiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [{
          role: "system",
          content: `You are a form field analyzer for the Delta Airlines Bag Guarantee form. 
                   Analyze the provided form fields and map them to the user information.
                   Pay special attention to the context information for each field, including labels, 
                   parent text, and aria labels to determine what each field is for.
                   particularly for fields with no contxet like those that say predictive_search as the ID, you must use the context information to determine what the field is for.
                   Return ONLY a JSON object with field names as keys and corresponding userInfo field names as values.
                   For example: {"firstName": "firstName", "email": "email"}
                   if you have tow things with the same key, append a _2 to the second one {
                     "predictive_search_abc123": "departureCity",
                     "predictive_search_abc123_2": "arrivalCity"
                   }
                     
                   `
        }, {
          role: "user",
          content: JSON.stringify({
            formElements: formElements,
            userInfo: config.userInfo
          })
        }]
      })
    });

    const data = await response.json();
    console.log('OpenAI response:', data);
    
    if (data.choices && data.choices[0]?.message?.content) {
      const content = data.choices[0].message.content;
      console.log('Raw OpenAI content:', content);
      
      // Clean the JSON string from any markdown formatting
      const cleanedContent = cleanJsonString(content);
      console.log('Cleaned content:', cleanedContent);
      
      const mapping = JSON.parse(cleanedContent);
      console.log('Parsed mapping:', mapping);
      return mapping;
    } else {
      throw new Error('Invalid OpenAI response');
    }
  } catch (error) {
    console.error('Error analyzing form with OpenAI:', error);
    throw error;
  }
}

// Main form filling function
async function fillDeltaForm() {
  console.log('Starting form fill process...');
  
  try {
    // Collect all form elements
    const formElements = collectFormElements();
    
    // Get mapping from OpenAI
    const mapping = await analyzeFormWithOpenAI(formElements);
    
    // Fill the form using the mapping
    await fillFormElements(mapping);
    
    // Look for and click submit button
    const submitButton = document.querySelector('button[type="submit"], input[type="submit"], .submit-button, #submit-button');
    if (submitButton) {
      // console.log('Found submit button, clicking...');
      // 
      // submitButton.click();
    } else {
      console.log('Submit button not found');
    }

    return { status: "completed" };
  } catch (error) {
    console.error('Error during form filling:', error);
    return { status: "error", message: error.message };
  }
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Content script received message:', request);
  
  if (request.action === "fillForm") {
    console.log('Starting form fill from message');
    console.log('Current URL:', window.location.href);
    
    fillDeltaForm().then(response => {
      console.log('Form fill response:', response);
      sendResponse(response);
    });
    return true; // Will respond asynchronously
  }
  return true;
});

console.log('Message listener set up in content script');

// Listen for form fill requests from the webpage
window.addEventListener('message', (event) => {
  console.log('Received message from webpage:', event.data);
  if (event.data.type === 'FILL_FORM') {
    console.log('Starting form fill from webpage message');
    fillDeltaForm();
  }
});

// Add auto-run functionality for the specific page
function checkUrlAndAutoFill() {
  console.log('Checking current URL:', window.location.href);
  
  if (window.location.href.includes('delta.com/bag-guarantee')) {
    console.log('On Delta bag guarantee page, scheduling auto-fill in 5 seconds...');
    
    // Wait 5 seconds then auto-fill
    setTimeout(() => {
      console.log('Auto-filling form now...');
      fillDeltaForm();
    }, 3000);
  }
}

// Run the URL check when the content script loads
checkUrlAndAutoFill();

// Also run the check whenever the page URL changes
window.addEventListener('popstate', checkUrlAndAutoFill);
window.addEventListener('hashchange', checkUrlAndAutoFill);

console.log('Content script loaded and ready with auto-fill capability');