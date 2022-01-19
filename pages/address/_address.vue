<template>
  <div>
    <error-modal/>
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
      <div class="is-horizontal-centered has-limited-width pb-6">
        <div v-if="loading">
          <progress class="progress is-small is-secondary mb-3" max="100"></progress>
        </div>
        <div class="mb-3">
          <nuxt-link to="/" class="has-text-white has-text-weight-light">&lt; back</nuxt-link>
        </div>
        <div class="box has-background-black-transparent bg-dark p-6 has-radius has-text-centered">
          <h2 class="title is-3 mb-6 has-text-weight-medium">Claim Your Vested <span class="has-text-accent">NOS</span> Tokens</h2>
          <div v-if="!address">
            <h3 class="subtitle has-text-danger">Invalid address</h3>
            <nuxt-link to="/" class="button">Home</nuxt-link>
          </div>
          <div v-else>
            <div class="has-text-weight-bold subtitle mb-1">Vesting Contract</div>
            <h3 v-if="address" class="subtitle blockchain-address"><a :href="`${explorer}/address/${address}`" target="_blank">{{ address }} <i class="fas fa-external-link-alt"></i></a></h3>
            <div class="has-text-weight-bold subtitle mb-1">Recipient Address</div>
            <h3 class="subtitle blockchain-address"><span
              v-if="vesting && vesting.recipient !== null"><a :href="`${explorer}/address/${vesting.recipient}`" target="_blank">{{ vesting.recipient }} <i class="fas fa-external-link-alt"></i></a></span><span v-else>...</span></h3> 
          </div>
        </div>
          <div class="columns is-multiline ">
  <!--            <div class="column">-->
  <!--              <div class="has-text-weight-bold">Locked tokens</div>-->
  <!--              <h2 class="subtitle"><span v-if="vesting.locked !== null">{{ vesting.locked }}</span><span-->
  <!--                v-else>...</span></h2>-->
  <!--            </div>-->
  <!--            <div class="column is-half">-->
  <!--              <div class="has-text-weight-bold">Start date</div>-->
  <!--              <small><span v-if="vesting && vesting.start">{{ new Date(parseInt(vesting.start) * 1000) }}</span><span-->
  <!--                v-else>...</span></small>-->
  <!--            </div>-->
            <div class="column is-half">
              <div class="box has-background-black-transparent py-5 bg-dark has-radius has-text-centered">
                <div class="has-text-weight-bold subtitle mb-5">Vesting Start Date</div>
                <h2 class="title has-text-accent is-4 mb-1 has-text-weight-medium" v-if="vesting && vesting.start_time">{{ new Date(vesting.start_time * 1000) | formatDate }}</h2><h2
                  v-else>...</h2>
              </div>
            </div>
            <div class="column is-half">
              <div class="box has-background-black-transparent py-5 bg-dark has-radius has-text-centered" style="height: 100%;">
              <div class="has-text-weight-bold subtitle mb-5">Vesting End Date</div>
              <h2 class="title has-text-accent is-4 mb-2 has-text-weight-medium" v-if="vesting && vesting.end_time ">{{ new Date(vesting.end_time * 1000) | formatDate }}</h2><h2
                v-else>...</h2>
              </div>
            </div>
            <div class="column is-half">
              <div class="box has-background-black-transparent py-5 bg-dark has-radius has-text-centered">
                <div class="has-text-weight-bold subtitle mb-5">Total Released</div>
                <h2 class="title has-text-accent is-4 has-text-weight-medium">
                  <span v-if="vesting && vesting.withdrawn_amount !== null && (typeof vesting.withdrawn_amount !== 'undefined') && vesting.total_amount">{{ +(vesting.withdrawn_amount/1000000) }} / {{ +(vesting.total_amount/1000000) }} <span class="has-text-weight-light">NOS</span></span>
                  <span v-else>...</span>
                </h2>
              </div>
            </div>
            <div class="column is-half">
              <div class="box has-background-black-transparent py-5 bg-dark has-radius has-text-centered">
                <div class="has-text-weight-bold subtitle mb-5">Claimable</div>
                <h2 class="title has-text-accent is-4 has-text-weight-medium">
                  <span v-if="releasable !== null && (typeof releasable !== 'undefined')">
                    {{+(releasable/1000000).toFixed(4)}}
                    <span class="has-text-weight-light">NOS</span>
                  </span>
                  <span v-else>...</span>
                </h2>
              </div>
            </div>
          </div>
          <div class="mb-6">
            <div v-if="!solWallet" class="button is-medium is-accent is-fullwidth mt-5" @click="$sol.loginModal = true">
              <strong>Connect Wallet</strong>
            </div>
            <div v-else>
              <form @submit.prevent="claim">
                <button class="button is-medium is-accent is-fullwidth mt-5" :class="{'is-loading': loading}" :disabled="loading || !address || !solWallet || !releasable"
                        type="submit">
                  <strong>Claim NOS Tokens</strong>
                </button>
                <div class="has-text-centered mt-2">
                  <a @click="$sol.logout" class="is-size-6  has-text-danger">Logout</a>
                </div>
              </form>
            </div>
          </div>
          <div v-if="tx !== null && tx.transactionHash" class="notification is-success mb-6">
            <button class="delete" @click="tx = null"/>
            Transaction sent: <a :href="`${explorer}/transaction/${tx.transactionHash}`">{{ tx.transactionHash }}</a>
          </div>
        </div>
      </div>
    </div>
    <!-- Educational Resources -->
    <!-- <div class="has-text-centered my-6">
      <a class="" href="https://nosana.io" target="_blank">
        <strong>nosana.io</strong>
      </a>
    </div> -->
</template>

<script>
const Layout = require('@streamflow/timelock/dist/layout');
import ErrorModal from '@/components/ErrorModal'
import { PublicKey } from '@solana/web3.js'

export default {
  components: {
    ErrorModal
  },
  data() {
    return {
      address: this.$route.params.address,
      error: null,
      loading: false,
      refreshReleasable: true,
      explorer: process.env.NUXT_ENV_BLOCKEXPLORER,
      vesting: null,
      tx: {}
    }
  },

  created() {
    if (!this.address) {
      this.error = 'Invalid address'
    } else {
      this.timer = setInterval(() => { this.refreshReleasable = !this.refreshReleasable }, 1000)
      this.getVestingInfo()

    }
  },

  filters: {
    formatDate(value) {
      if (value) {
        const year = value.getFullYear();
        const month = value.toLocaleString('default', { month: 'long' });
        const day = value.getDate();
        const seconds = value.getSeconds();
        const minutes = value.getMinutes();
        const hour = value.getHours();
        return `${month} ${day} ${year} - ${hour}:${(minutes < 10 ? '0' : '') + minutes}`
      }
    }
  },

  beforeDestroy () {
    clearInterval(this.timer)
  },

  computed: {
    solWallet() {
      return (this.$sol) ? this.$sol.publicKey : null
    },
    releasable() {
      // eslint-disable-next-line
      this.refreshReleasable
      if (this.vesting && this.vesting.start_time && this.vesting.end_time && this.vesting.total_amount ) {
        return this.calculateReleasable(this.vesting.start_time, this.vesting.end_time, this.vesting.total_amount, this.vesting.withdrawn_amount)
      }
      return null
    }
  },

  methods: {
    calculateReleasable(start, end, locked, released) {
      const now = new Date()
      const duration = end - start
      const releasable = (((locked+released) * (now.getTime()/1000 - start))/duration) - released;
      return Math.max(0, Math.min(locked, releasable))
    },
    handleError(error) {
      console.error(error)
      if (error.response && error.response.data) {
        if (error.response.data.error) {
          this.error = error.response.data.error
        } else if (error.response.data.message) {
          this.error = error.response.data.message
        } else {
          this.error = error.response.data
        }
      } else if (error.message) {
        this.error = error.message
      } else {
        this.error = error
      }
    },

    async getVestingInfo() {
      this.loading = true
      try {

        const response = await this.$sol.web3.getAccountInfo(new PublicKey(this.address))
        this.vesting = Layout.decode(Buffer.from(response.data));
      } catch (error) {
        this.handleError(error)
      }
      this.loading = false
    }
  }
}
</script>

<style lang="scss" scoped>
.site-title {
  font-size: 75px;
}

.blockchain-address {
  color: #1C0039;
  text-overflow: ellipsis;
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  display: block;
}

.tilde {
  font-family: $subtitle-family;
}
</style>
