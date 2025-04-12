<template>
  <div id="app">
    <Main />
  </div>
</template>

<script>
import Main from './components/Main.vue'; 

export default {
  name: 'App',
  components: {
    Main, 
  },
};
</script>

<style>
@import url("https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css");

html, body, #app {
  margin: 0;
  padding: 0;
  height: 100%;
  background-color: #1a1a1a;
  overflow-y: auto;
}

html {
  scroll-behavior: smooth;
}
</style>