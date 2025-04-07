<template>
  <div class="fb-reels-downloader">
    <div class="background-animation"></div>
    <div class="container">
      <h1 class="title">StelleFDOwnloader</h1>
      <p class="subtitle">Stelle Facebook Downloader is Free and Open source, <a id="github-link" href="https://github.com/dlcuy22/StelleFDownloader" target="_blank" rel="noopener noreferrer">github</a></p>
      <div class="search-box">
        <!-- <i class="fas fa-link icon">🔗</i> -->
        <i class="link-icon">🔗</i>
        <input
          id="search"
          v-model="url"
          type="text"
          placeholder="Paste Facebook Reel link here..."
        />
        <button class="confirm-button" @click="">
          <i class="paste-icon"></i> Download
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const url = ref('')



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
  
  // Force initial background
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
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow: hidden;
  background: #1a1a1a;
}

.fb-reels-downloader * {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.background-animation {
  position: absolute;
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
}

.search-box {
  position: relative;
  width: 100%;
  background: #2d2d2d;
  border-radius: 15px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  transition: all 0.3s ease;
}

.search-box:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 20px rgba(0, 0, 0, 0.4);
}

.link-icon{
  position: absolute;
  top: 50%;
  left: 20px;
  transform: translateY(-50%);
}
#github-link{
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

.paste-button:hover {
  background: #5a5a5a;
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


</style>