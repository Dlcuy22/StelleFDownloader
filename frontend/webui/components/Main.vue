<template>
  <div class="fb-reels-downloader">
    <div class="background-animation"></div>
    <div class="container">
      <h1 class="title">StelleFDownloader</h1>
      <p class="subtitle">Stelle Facebook Downloader is Free and Open source, see <a id="github-link" href="https://github.com/dlcuy22/StelleFDownloader" target="_blank" rel="noopener noreferrer">github</a></p>
      <div class="search-box">
        <i class="link-icon">🔗</i>
        <input
          id="search"
          v-model="url"
          type="text"
          placeholder="Paste Facebook Reel link here..."
        />
        <button class="confirm-button" @click="handleDownload" :disabled="loading">
          {{ loading ? 'Processing...' : 'Download' }}
        </button>
      </div>

      <div v-if="availableLinks" class="quality-options" ref="qualityOptionsRef">
        <h3 class="quality-title">Choose Quality:</h3>
        <div v-for="(link, quality) in availableLinks" :key="quality" class="quality-item">
          <video
            class="preview-video"
            controls
            :src="cleanUrl(link)"
          ></video>
          <a
            class="download-button"
            :href="cleanUrl(link)"
            :download="getFilename(link, quality, title)"
          >
            Download {{ quality }}
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import Swal from 'sweetalert2'
const url = ref('')
const cdnUrl = ref(null)
const loading = ref(false)
const availableLinks = ref(null)
const title = ref('')
const qualityOptionsRef = ref(null)

const handleDownload = async () => {
  if (!url.value) {
    Swal.fire('Oops!', 'Please paste a link first.', 'warning')
    return
  }

  loading.value = true
  cdnUrl.value = null
  availableLinks.value = null

  try {
    const res = await fetch('http://dev.esempe.fun:8080/api/download', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: url.value }),
    }) // this is a free server but you can change the api by your own server.

    const data = await res.json()

    if (res.ok && data.links && Object.keys(data.links).length > 0) {
      title.value = data.title || ''
      const qualities = Object.keys(data.links)
      const selected = qualities.find(q => q.toLowerCase().includes('high')) || qualities[0]

      cdnUrl.value = data.links[selected]
      availableLinks.value = data.links

      console.log('Video CDN URL:', cdnUrl.value)
      
     
      nextTick(() => {
        scrollToQualityOptions()
      })
    } else {
      Swal.fire('Failed', data?.message || 'No download links found.', 'error')
    }
  } catch (err) {
    console.error(err)
    Swal.fire('Error', 'Error connecting to backend.', 'error')
  } finally {
    loading.value = false
  }
}


watch(availableLinks, (newValue) => {
  if (newValue) {
    nextTick(() => {
      scrollToQualityOptions()
    })
  }
})

function scrollToQualityOptions() {
  if (qualityOptionsRef.value) {
    // Force global scrolling to make sure it works
    window.scrollTo({
      top: qualityOptionsRef.value.getBoundingClientRect().top + window.pageYOffset - 20,
      behavior: 'smooth'
    })
  }
}

function cleanUrl(rawUrl) {
  return rawUrl
    .replace(/\\\\/g, '\\')
    .replace(/\\\//g, '/')
    .replace(/^"(.*)"$/, '$1')
}

function sanitizeFilename(name) {
  return name.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_')
}

function trimToLimit(baseName, maxLength) {
  return baseName.length > maxLength ? baseName.substring(0, maxLength) : baseName
}

function getFilename(rawUrl, quality, videoTitle = '') {
  try {
    let filename = videoTitle ? 
      `${sanitizeFilename(videoTitle)}_${quality}` : 
      `video_${quality}`
    
    if (rawUrl) {
      const cleanedUrl = cleanUrl(rawUrl)
      const urlObj = new URL(cleanedUrl)
      const pathFilename = urlObj.pathname.split('/').pop()
      
      if (pathFilename) {
        filename = decodeURIComponent(pathFilename)
      }
    }

    if (!filename.toLowerCase().endsWith('.mp4')) {
      filename += '.mp4'
    }

    const baseName = filename.replace(/\.mp4$/i, '')
    const prefix = 'StelleFDown_'
    const trimmedBase = trimToLimit(baseName, 25 - prefix.length)
    return `${prefix}${trimmedBase}.mp4`
  } catch (err) {
    console.error('Error in getFilename:', err)
    return `StelleFDown_video_${quality}.mp4`
  }
}

const handleMouseMove = (e) => {
  const x = e.clientX / window.innerWidth
  const y = e.clientY / window.innerHeight

  const angle = 45 + x * 10
  const gradient = `linear-gradient(${angle}deg, #1a1a1a, #2d2d2d ${y * 100}%)`

  const bg = document.querySelector('.fb-reels-downloader .background-animation')
  if (bg) bg.style.background = gradient
}

onMounted(() => {
  document.addEventListener('mousemove', handleMouseMove)
  

  const bg = document.querySelector('.fb-reels-downloader .background-animation')
  if (bg) bg.style.background = 'linear-gradient(45deg, #1a1a1a, #2d2d2d)'
})

onBeforeUnmount(() => {
  document.removeEventListener('mousemove', handleMouseMove)
})
</script>

<style scoped>
.fb-reels-downloader {
  width: 100%;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  position: relative;
  background: #1a1a1a;
  padding: 40px 0;
}

.fb-reels-downloader * {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.background-animation {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(45deg, #1a1a1a, #2d2d2d);
  opacity: 0.8;
  z-index: 0;
}

.container {
  width: 100%;
  max-width: 600px;
  padding: 20px;
  position: relative;
  z-index: 1;
  margin: auto 0;
}

.search-box {
  position: relative;
  width: 100%;
  background: #2d2d2d;
  border-radius: 15px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  transition: all 0.3s ease;
  margin-bottom: 25px;
}

.search-box:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 20px rgba(0, 0, 0, 0.4);
}

.link-icon {
  position: absolute;
  top: 50%;
  left: 20px;
  transform: translateY(-50%);
}

#github-link {
  text-decoration: none;
  color: white;
}

.search-box::before {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: linear-gradient(45deg, #3a3a3a, #4a4a4a, #3a3a3a);
  border-radius: 16px;
  z-index: -1;
  animation: borderAnimation 3s linear infinite;
}

@keyframes borderAnimation {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

#search {
  width: 100%;
  padding: 20px 50px;
  background: #2d2d2d;
  border: none;
  color: #ffffff;
  font-size: 16px;
  outline: none;
}

#search::placeholder {
  color: #808080;
  opacity: 1;
}

.icon {
  position: absolute;
  left: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: #4a4a4a;
  font-size: 20px;
}

.confirm-button {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  background: #4a4a4a;
  color: #ffffff;
  border: none;
  padding: 8px 15px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.confirm-button:hover {
  background: #5a5a5a;
}

.confirm-button:disabled {
  background: #3a3a3a;
  cursor: not-allowed;
}

.title {
  text-align: center;
  color: #ffffff;
  margin-bottom: 30px;
  font-size: 2em;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.subtitle {
  text-align: center;
  color: #808080;
  margin-bottom: 20px;
  font-size: 1em;
}

.quality-options {
  margin-top: 25px;
  background: #2d2d2d;
  border-radius: 15px;
  padding: 20px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
  animation: fadeIn 0.5s ease;
  scroll-margin-top: 20px;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.quality-title {
  color: #ffffff;
  margin-bottom: 15px;
  font-size: 1.2em;
  text-align: center;
}

.quality-item {
  margin-bottom: 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.quality-item:last-child {
  margin-bottom: 0;
}

.preview-video {
  width: 100%;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  margin-bottom: 10px;
}

.download-button {
  background: #4a4a4a;
  color: #ffffff;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  font-size: 14px;
  display: inline-block;
  text-align: center;
  margin-top: 8px;
}

.download-button:hover {
  background: #5a5a5a;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

/* Media queries for better responsiveness */
@media (max-width: 768px) {
  .container {
    padding: 15px;
  }
  
  .title {
    font-size: 1.8em;
  }
  
  .quality-options {
    padding: 15px;
  }
}

@media (max-width: 480px) {
  .container {
    padding: 10px;
  }
  
  .title {
    font-size: 1.6em;
    margin-bottom: 20px;
  }
  
  #search {
    padding: 15px 50px;
    font-size: 14px;
  }
  
  .quality-options {
    padding: 12px;
  }
  
  .download-button {
    padding: 8px 16px;
    font-size: 13px;
  }
}
</style>