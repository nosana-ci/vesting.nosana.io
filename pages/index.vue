<template>
  <div>
    <section class="section">
      <div class="container">
        <div class="has-text-centered block">
          <a class="" href="https://nosana.io" target="_blank">
            <img :src="require('@/assets/img/logo.svg')" width="175" class="mb-4">
          </a>
        </div>
      </div>
    </section>
    <div class="container">
      <div class="box is-horizontal-centered has-limited-width px-6 pb-6 pt-5 gradient-block has-border-gradient has-radius">
        <h2 class="title is-2 has-text-centered has-text-weight-medium mb-6 mt-3">Vesting Contract</h2>
        <form @submit.prevent="$router.push(`/address/${address}`)">
          <input v-model="address" type="text" class="input is-medium is-primary is-transparent" required placeholder="BSC address" />
          <button :disabled="!address" class="button is-medium is-accent is-fullwidth mt-5" type="submit">
            <strong>Submit</strong>
          </button>
        </form>
      </div>
    </div>
    <!-- Educational Resources -->
    <!-- <div class="has-text-centered my-6">
      <a class="" href="https://nosana.io" target="_blank">
        <strong>nosana.io</strong>
      </a>
    </div> -->
  </div>
</template>

<script>

export default {
  components: {},
  data () {
    return {
      address: null
    }
  },

  methods: {},

  created () {
  },
}
</script>

<style lang="scss" scoped>
.site-title {
  font-size: 75px;
}
.bg-dark {
  background-image: url('~assets/img/bg.jpg');
  color: white;
  .title, .subtitle {
    color: white;
  }
}
.is-primary {
  color: rgba(255,255,255,0.8);
  &::placeholder {
    color: rgba(255,255,255,0.8);;
  }
}
</style>
