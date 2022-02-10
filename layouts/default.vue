<template>
  <div id="app">
    <client-only>
      <sol-wallet />
    </client-only>
    <Nuxt />

    <footer class="footer">
      <div class="content has-text-centered">
        <p class="is-flex is-justify-content-center">
          Powered by <a class="ml-3" href="https://streamflow.finance" target="_blank"><img src="~assets/img/streamflow.png" /></a>
        </p>
      </div>
    </footer>
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
