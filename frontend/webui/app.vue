<!-- App.vue -->
<template>
  <div id="app">
    <Main />
  </div>
</template>

<script>
import Main from './components/Main.vue'; // Import the component

export default {
  name: 'App',
  components: {
    Main, // Register the component
  },
};
</script>

<style>
@import url("https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css");

html, body, #app {
  margin: 0;
  padding: 0;
  margin: 0;
  padding: 0;
  height: 100%;
  background-color: #1a1a1a; 
  overflow: hidden;
}
</style>
