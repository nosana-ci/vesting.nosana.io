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
      <div class="box is-horizontal-centered has-text-centered has-limited-width px-6 pb-6 pt-5 gradient-block has-border-gradient has-radius">

        <h2 class="title is-2 has-text-centered has-text-weight-medium mb-6 mt-3">Vesting Contract</h2>
               <div v-if="!solWallet && !vestings">
               <div class="button is-medium is-accent" @click="$sol.loginModal = true">
              <strong>Connect Wallet</strong>
            </div>
            <h3 class="subtitle my-3">
              - OR -
            </h3>
               </div>
        <form @submit.prevent="retrieveVestingContracts(address)" v-if="!vestings">
          <input v-model="address" type="text" class="input is-medium is-primary is-transparent" required placeholder="SOL address" />
          <button :disabled="loading" :class="{'is-disabled': loading}" class="button is-medium is-accent is-fullwidth mt-5" type="submit">
            <strong>Find Vesting Contracts</strong>
          </button>
        </form>
        <div v-for="vesting, pubkey in vestings" :key="pubkey">
          <nuxt-link :to="'/address/'+pubkey">{{pubkey}}</nuxt-link> - 
          {{ +(vesting.withdrawn_amount/1000000) }} / {{ +(vesting.total_amount/1000000) }} <span class="has-text-accent">NOS</span>
        </div>
        <div v-if="loading">
          Loading..
        </div>
        <div v-else-if="vestings && !Object.keys(vestings).length">
          No vesting contracts found
        </div>
        <div v-else-if="vestings" class="mt-6">
          <a @click.prevent="reload" class="is-size-6  has-text-danger ">Use different address</a>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { PublicKey } from '@solana/web3.js'
const Layout = require('@streamflow/timelock/dist/layout');

export default {
  components: {},
  created() {
    console.log('test', this.solWallet)
    if (this.solWallet) {
        this.retrieveVestingContracts(this.solWallet)
      }
  },
  computed: {
    solWallet() {
      return (this.$sol) ? this.$sol.publicKey : null
    },
  },
  watch: {
    solWallet(publicKey) {
      if (publicKey) {
        this.retrieveVestingContracts(publicKey)
      }
    }
  },
  data () {
    return {
      address: null,
      loading: null,
      vestings: null
    }
  },

  methods: {
    reload() {
      window.location.reload(true)
    },
    async retrieveVestingContracts(publicKey) {
      this.loading = true
      try {
         const response = await this.$sol.web3.getProgramAccounts(new PublicKey('8e72pYCDaxu3GqMfeQ5r8wFgoZSYk6oua1Qo9XpsZjX'), {
          filters: [
            {
              memcmp: {
                offset: 112,
                bytes: publicKey,
              },
            },
          ],
        });
        let vestings = {}
        for (let i = 0; i < response.length; i++) {
          const info = await this.$sol.web3.getAccountInfo(response[i].pubkey)
          vestings[response[i].pubkey.toString()] = Layout.decode(Buffer.from(info.data));
        }
        this.vestings = vestings;
      } catch (e) {
        console.error(e)
        
      }
      this.loading = false;
    },
  },
}
</script>

<style lang="scss" scoped>
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
