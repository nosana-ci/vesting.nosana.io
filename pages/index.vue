<template>
  <div>
    <section class="section">
      <div class="blur-background">
        <img src="~assets/img/oval-green.png">
        <img src="~assets/img/oval-yellow.png">
      </div>
      <div class="container">
        <div class="has-text-centered block">
          <a class="" href="https://nosana.io" target="_blank">
            <img
              :src="require('@/assets/img/logo.svg')"
              width="175"
              class="mb-4"
            >
          </a>
        </div>
      </div>
    </section>
    <div class="container">
      <div
        class="
          box
          is-horizontal-centered
          has-text-centered has-limited-width
          px-6
          pb-6
          pt-5
          gradient-block
          has-border-gradient has-radius
        "
      >
        <h2
          class="title is-2 has-text-centered has-text-weight-medium mb-6 mt-3"
        >
          Vesting Contract
        </h2>
        <div v-if="!solWallet && !vestings">
          <div
            class="button is-medium is-accent"
            @click="$sol.loginModal = true"
          >
            <strong>Connect Wallet</strong>
          </div>
          <h3 class="subtitle my-3">
            - OR -
          </h3>
        </div>
        <form
          v-if="!vestings"
          @submit.prevent="retrieveVestingContracts(address)"
        >
          <input
            v-model="address"
            type="text"
            class="input is-medium is-primary is-transparent"
            required
            placeholder="SOL address"
          >
          <button
            :disabled="loading"
            :class="{ 'is-disabled': loading }"
            class="button is-medium is-accent is-fullwidth mt-5"
            type="submit"
          >
            <strong>Find Vesting Contracts</strong>
          </button>
        </form>
        <template v-for="(vesting, pubkey) in vestings">
          <atropos v-if="!vesting.canceled_at.toNumber()" :key="pubkey" :options="{rotateTouch: false}" class="mb-4">
            <nuxt-link
              :to="'/address/' + pubkey"
              class="mb-0 box is-info is-clickable is-flex is-align-items-center has-text-left"
            >
              <h3 class="subtitle m-0 is-6">
                {{ +(vesting.withdrawn_amount / 1000000) }} /
                {{ +(vesting.total_amount / 1000000) }}
                <span class="has-text-accent">NOS</span>
              </h3>
              <progress
                style="margin:0; margin-left: auto; width: 50%"
                class="progress is-accent"
                :value="vesting.withdrawn_amount"
                :max="vesting.total_amount"
              />
              <div class="ml-2">
                <i
                  class="fas fa-chevron-right"
                />
              </div>
            </nuxt-link>
          </atropos>
        </template>
        <div v-if="loading">
          Loading..
        </div>
        <div v-else-if="vestings && !Object.keys(vestings).length">
          No NOS vesting contracts found
        </div>
        <div v-if="vestings" class="mt-4">
          <!-- <nuxt-link to="/create" class="button is-accent is-outlined"
            >Create Vesting Contract</nuxt-link
          > -->
          <div class="mt-4">
            <a
              class="is-size-6 has-text-danger"
              @click.prevent="reload"
            >Use different address</a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { PublicKey } from '@solana/web3.js';
const Layout = require('@streamflow/timelock/dist/layout');

export default {
  components: {},
  data () {
    return {
      address: null,
      loading: null,
      vestings: null
    };
  },
  computed: {
    solWallet () {
      return this.$sol && this.$sol.wallet && this.$sol.wallet.publicKey
        ? this.$sol.wallet.publicKey.toString()
        : null;
    }
  },
  watch: {
    solWallet (publicKey) {
      console.log('change', publicKey);
      if (publicKey) {
        this.retrieveVestingContracts(publicKey);
      }
    }
  },
  created () {
    if (this.solWallet) {
      this.retrieveVestingContracts(this.solWallet);
    }
  },

  methods: {
    reload () {
      window.location.reload(true);
    },
    async retrieveVestingContracts (publicKey) {
      this.loading = true;
      try {
        const response = await this.$sol.web3.getProgramAccounts(
          new PublicKey('8e72pYCDaxu3GqMfeQ5r8wFgoZSYk6oua1Qo9XpsZjX'),
          {
            filters: [
              {
                memcmp: {
                  offset: 112,
                  bytes: publicKey.trim()
                }
              }
            ]
          }
        );
        const vestings = {};
        for (let i = 0; i < response.length; i++) {
          const info = await this.$sol.web3.getAccountInfo(response[i].pubkey);
          const decoded = Layout.decode(Buffer.from(info.data));
          if (decoded.mint.toString() === process.env.NUXT_ENV_TOKEN_ADDRESS) {
            vestings[response[i].pubkey.toString()] = decoded;
          }
        }
        this.vestings = vestings;
      } catch (e) {
        console.error(e);
      }
      this.loading = false;
    }
  }
};
</script>

<style lang="scss" scoped>

.is-primary {
  color: rgba(255, 255, 255, 0.8);
  &::placeholder {
    color: rgba(255, 255, 255, 0.8);
  }
}
</style>
