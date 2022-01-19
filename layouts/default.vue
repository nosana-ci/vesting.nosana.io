<template>
  <div id="app">
    <client-only>
      <sol-wallet />
    </client-only>
    <Nuxt />
  </div>
</template>

<script>
import SolWallet from '@/components/SolWallet';

export default {
  components: {
    SolWallet
  }
}
</script>

<style lang="scss">
html {
  min-height: 100vh;
  background: url('~assets/img/bg.jpg');
  background-size: cover;
  background-position: center;
}
</style>
