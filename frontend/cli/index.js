const blessed = require('blessed');
const axios = require('axios');
const fs = require('fs');
const { exec, spawn } = require('child_process');
const path = require('path');
const url = require('url');

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

// Progress bar for download
const progressBar = blessed.progressbar({
  parent: screen,
  top: 18,
  left: 'center',
  width: '80%',
  height: 3,
  label: ' Download Progress ',
  border: 'line',
  style: {
    fg: 'blue',
    bg: 'black',
    bar: {
      bg: 'green'
    },
    border: { fg: 'white' }
  },
  filled: 0,
  hidden: true
});

// Download info
const downloadInfo = blessed.box({
  parent: screen,
  top: 22,
  left: 'center',
  width: '80%',
  height: 3,
  content: '',
  align: 'center',
  valign: 'middle',
  style: {
    fg: 'white'
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

// Extract filename from URL
function getFilenameFromUrl(rawUrl) {
  try {
    // Parse the URL
    const parsedUrl = new URL(rawUrl);
    // Get the pathname
    const pathname = parsedUrl.pathname;
    // Get the last segment of the path
    const segments = pathname.split('/');
    const lastSegment = segments[segments.length - 1];
    
    // If we have a filename with extension
    if (lastSegment && lastSegment.includes('.')) {
      return decodeURIComponent(lastSegment);
    }
    
    // If no valid filename found in the URL
    return null;
  } catch (err) {
    return null;
  }
}

// Download file with progress
function downloadWithProgress(url, outFile) {
  return new Promise((resolve, reject) => {
    // Show progress elements
    progressBar.show();
    downloadInfo.show();
    downloadInfo.content = `Downloading to: ${path.basename(outFile)}`;
    screen.render();
    
    // Use curl with progress option
    const curl = spawn('curl', [
      '-L',              // Follow redirects
      '-#',              // Show progress as bar
      '-o', outFile,     // Output file
      url                // URL to download
    ]);
    
    curl.stderr.on('data', (data) => {
      const output = data.toString();
      // Parse progress percentage from curl output
      const match = output.match(/(\d+\.\d+)%/);
      if (match && match[1]) {
        const percentage = parseFloat(match[1]);
        progressBar.setProgress(percentage);
        screen.render();
      }
    });
    
    curl.on('close', (code) => {
      if (code === 0) {
        progressBar.setProgress(100);
        downloadInfo.content = `Download complete: ${path.basename(outFile)}`;
        downloadInfo.style.fg = 'green';
        screen.render();
        resolve();
      } else {
        downloadInfo.content = `Download failed with code: ${code}`;
        downloadInfo.style.fg = 'red';
        screen.render();
        reject(new Error(`Download failed with code: ${code}`));
      }
    });
    
    curl.on('error', (err) => {
      downloadInfo.content = `Download error: ${err.message}`;
      downloadInfo.style.fg = 'red';
      screen.render();
      reject(err);
    });
  });
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
    
    // Store original video title if available
    const videoTitle = res.data.title || null;
    
    list.setItems(qualities);
    list.show();
    statusBox.hide();
    screen.render();

    list.once('select', async (item, index) => {
      const quality = qualities[index];
      // Remove backslashes that might be escaping the URL incorrectly
      const rawUrl = links[quality]
        .replace(/\\\\/g, '\\')
        .replace(/\\\//g, '/')
        .replace(/^"(.*)"$/, '$1'); // Remove surrounding quotes if present
          
          function sanitizeFilename(name) {
            return name.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_');
          }
          
          function trimToLimit(baseName, maxLength) {
            if (baseName.length > maxLength) {
              return baseName.substring(0, maxLength);
            }
            return baseName;
          }

      // Try to get original filename from URL
      let filename = getFilenameFromUrl(rawUrl);
      
      // If no filename from URL, use video title if available
      if (!filename && videoTitle) {
        filename = `${videoTitle.replace(/[^\w\s-]/g, '')}_${quality}.mp4`;
      }
      
      // If still no filename, fall back to quality-based name
      if (!filename) {
        const sanitizedQuality = quality.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        filename = `video_${sanitizedQuality}.mp4`;
      }
      
      // Ensure filename has proper extension
      if (!filename.toLowerCase().endsWith('.mp4')) {
        filename += '.mp4';
      }
      const baseName = filename.replace(/\.mp4$/i, '');
      const prefix = 'StelleFDown_';

      const maxTotalLength = 25;
      const trimmedBase = trimToLimit(baseName, maxTotalLength - prefix.length);
      filename = `${prefix}${trimmedBase}.mp4`;
      
      const outFile = path.join(process.cwd(), filename);
      
      showStatus(`Preparing to download: ${filename}`, 'blue');
      
      try {
        await downloadWithProgress(rawUrl, outFile);
        
        // Leave UI open for 2 seconds to show completion
        setTimeout(() => {
          screen.destroy();
          console.log(`\nDownload complete: ${outFile}`);
          process.exit(0);
        }, 2000);
      } catch (err) {
        showStatus(`Download failed: ${err.message}`, 'red');
        // Keep UI open for error message
        setTimeout(() => {
          screen.destroy();
          console.error(`\nDownload failed: ${err.message}`);
          process.exit(1);
        }, 5000);
      }
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