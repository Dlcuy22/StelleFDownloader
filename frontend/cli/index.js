const blessed = require('blessed');
const axios = require('axios');
const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');

// Create UI screen
const screen = blessed.screen({
  smartCSR: true,
  title: 'Video Downloader',
  fullUnicode: true
});

// Status message box
const statusBox = blessed.box({
  parent: screen,
  top: 7,
  left: 'center',
  width: '80%',
  height: 3,
  content: '',
  align: 'center',
  valign: 'middle',
  border: 'line',
  style: {
    fg: 'yellow',
    border: { fg: 'yellow' }
  },
  hidden: true
});

// Main form container
const form = blessed.form({
  parent: screen,
  width: '90%',
  height: 7,
  top: 1,
  left: 'center',
  keys: true,
  border: 'line',
  style: {
    border: { fg: 'white' }
  }
});

// URL input label
blessed.text({
  parent: form,
  content: 'Video URL:',
  top: 1,
  left: 2,
  style: {
    fg: 'white'
  }
});

// Fixed URL input with better visibility
const urlInput = blessed.textbox({
  parent: form,
  name: 'url',
  top: 2,
  left: 2,
  height: 1,
  width: '95%-4',
  inputOnFocus: true,
  style: {
    fg: 'white',
    bg: 'black',
    focus: {
      fg: 'white',
      bg: 'blue'
    }
  }
});

// Submit button with better visibility
const submitBtn = blessed.button({
  parent: form,
  mouse: true,
  keys: true,
  shrink: true,
  padding: { left: 2, right: 2, top: 0, bottom: 0 },
  top: 4,
  left: 2,
  name: 'submit',
  content: 'Submit',
  style: {
    bg: 'blue',
    fg: 'white',
    focus: { 
      bg: 'green',
      fg: 'white'
    },
    hover: {
      bg: 'cyan'
    }
  }
});

// Quality selection list
const list = blessed.list({
  parent: screen,
  top: 10,
  left: 'center',
  width: '90%',
  height: '40%',
  label: ' Choose Quality ',
  align: 'left',
  border: 'line',
  keys: true,
  vi: true,
  mouse: true,
  style: {
    fg: 'white',
    bg: 'black',
    border: { fg: 'white' },
    selected: {
      bg: 'blue',
      fg: 'white',
      bold: true
    },
    item: {
      fg: 'white'
    }
  },
  hidden: true
});

// Help text at bottom
const helpText = blessed.text({
  parent: screen,
  bottom: 0,
  left: 'center',
  content: 'Press [q] to quit, [Enter] to select',
  style: {
    fg: 'gray'
  }
});

// Show status message
function showStatus(message, fg = 'yellow') {
  statusBox.content = message;
  statusBox.style.fg = fg;
  statusBox.show();
  screen.render();
}

submitBtn.on('press', () => form.submit());

form.on('submit', async (data) => {
  const { url } = data;
  
  if (!url || url.trim() === '') {
    showStatus('Please enter a valid URL', 'red');
    return;
  }
  
  showStatus('Fetching available formats...', 'yellow');
  
  try {
    // Make sure your API server is running at this address
    const res = await axios.post('http://localhost:8080/api/download', { url }, {
      timeout: 10000 // 10 second timeout
    });
    
    if (!res.data || !res.data.links || Object.keys(res.data.links).length === 0) {
      showStatus('No download links found!', 'red');
      return;
    }
    
    const links = res.data.links;
    const qualities = Object.keys(links);
    
    list.setItems(qualities);
    list.show();
    statusBox.hide();
    screen.render();

    list.once('select', (item, index) => {
      const quality = qualities[index];
      // Remove backslashes that might be escaping the URL incorrectly
      const rawUrl = links[quality]
        .replace(/\\\\/g, '\\')
        .replace(/\\\//g, '/')
        .replace(/^"(.*)"$/, '$1'); // Remove surrounding quotes if present
      
      // Create a safe filename from the quality
      const sanitizedQuality = quality.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      const outFile = path.join(process.cwd(), `video_${sanitizedQuality}.mp4`);

      // Show status before starting download
      screen.destroy();
      console.log(`Downloading ${quality}...`);
      console.log(`URL: ${rawUrl}`);
      console.log(`Saving to: ${outFile}`);
      
      // Use a more reliable download method with proper error handling
      const curlCommand = `curl -L "${rawUrl}" -o "${outFile}"`;
      exec(curlCommand, (err, stdout, stderr) => {
        if (err) {
          console.error('Download failed:', err.message);
          console.error('Command output:', stderr);
          return;
        }
        console.log('Download finished successfully:', outFile);
      });
    });

    list.focus();
  } catch (err) {
    let errorMessage = 'Error fetching download links';
    
    if (err.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      errorMessage += `: Server returned ${err.response.status}`;
    } else if (err.request) {
      // The request was made but no response was received
      errorMessage += ': No response from server. Is the API server running?';
    } else {
      // Something happened in setting up the request
      errorMessage += `: ${err.message}`;
    }
    
    showStatus(errorMessage, 'red');
    console.error(errorMessage);
  }
});

// Support input field
urlInput.key('enter', function() {
  form.submit();
});

// Set up focus and key handlers
urlInput.focus();
screen.key(['q', 'C-c'], () => process.exit(0));
screen.render();