<template>
  <div>
    <div class="blur-background">
      <img src="~assets/img/oval-green.png">
      <img src="~assets/img/oval-yellow.png">
    </div>
    <error-modal />
    <section class="section">
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
      <div class="is-horizontal-centered has-limited-width pb-6">
        <div v-if="loading">
          <progress
            class="progress is-small is-secondary mb-3"
            max="100"
          />
        </div>
        <div class="mb-3">
          <nuxt-link
            to="/"
            class="has-text-white has-text-weight-light"
          >
            &lt; back
          </nuxt-link>
        </div>
        <atropos :options="{rotateTouch: false}" class="mb-5">
          <div
            class="
            box mb-0
            has-background-black-transparent
            bg-dark
            p-6
            has-radius has-text-centered
          "
          >
            <h2 class="title is-3 mb-6 has-text-weight-medium">
              Claim Your Vested <span class="has-text-accent">NOS</span> Tokens
            </h2>
            <div v-if="!address">
              <h3 class="subtitle has-text-danger">
                Invalid address
              </h3>
              <nuxt-link to="/" class="button">
                Home
              </nuxt-link>
            </div>
            <div v-else>
              <div class="has-text-weight-bold subtitle mb-1">
                Vesting Contract
              </div>
              <h3 v-if="address" class="subtitle blockchain-address">
                <a
                  :href="`${explorer}/address/${address}`"
                  target="_blank"
                >{{ address }} <i class="fas fa-external-link-alt" /></a>
              </h3>
              <div class="has-text-weight-bold subtitle mb-1">
                Recipient Address
              </div>
              <h3 class="subtitle blockchain-address">
                <span
                  v-if="vesting && vesting.recipient !== null"
                ><a
                  :href="`${explorer}/address/${vesting.recipient}`"
                  target="_blank"
                >{{ vesting.recipient }}
                  <i class="fas fa-external-link-alt" /></a></span><span v-else>...</span>
              </h3>
            </div>
          </div>
        </atropos>
        <div class="columns is-multiline">
          <div class="column is-half">
            <atropos :options="{rotateTouch: false}">
              <div
                class="
                box mb-0
                has-background-black-transparent
                py-5
                bg-dark
                has-radius has-text-centered
              "
              >
                <div class="has-text-weight-bold subtitle mb-5">
                  Vesting Start Date
                </div>
                <h2
                  v-if="vesting && vesting.start_time"
                  class="title has-text-accent is-5 mb-1 has-text-weight-medium has-tooltip-arrow has-tooltip-fade"
                  :data-tooltip="'UTC: ' + new Date(vesting.start_time * 1000).toUTCString()"
                >
                  {{ new Date(vesting.start_time * 1000) | formatDate }}
                </h2>
                <h2 v-else>
                  ...
                </h2>
              </div>
            </atropos>
          </div>
          <div class="column is-half">
            <atropos :options="{rotateTouch: false}">
              <div
                class="
                box mb-0
                has-background-black-transparent
                py-5
                bg-dark
                has-radius has-text-centered
              "
                style="height: 100%"
              >
                <div class="has-text-weight-bold subtitle mb-5">
                  Vesting End Date
                </div>
                <h2
                  v-if="vesting && vesting.end_time"
                  class="title has-text-accent is-5 mb-2 has-text-weight-medium"
                  :data-tooltip="'UTC: ' + new Date(vesting.end_time * 1000).toUTCString()"
                >
                  {{ new Date(vesting.end_time * 1000) | formatDate }}
                </h2>
                <h2 v-else>
                  ...
                </h2>
              </div>
            </atropos>
          </div>
          <div class="column is-half">
            <atropos :options="{rotateTouch: false}">
              <div
                class="
                box mb-0
                has-background-black-transparent
                py-5
                bg-dark
                has-radius has-text-centered
              "
                style="height: 100%"
              >
                <div class="has-text-weight-bold subtitle mb-5">
                  Unlocked at start time
                </div>
                <h2
                  v-if="vesting && vesting.cliff_amount !== null"
                  class="title has-text-accent is-5 mb-2 has-text-weight-medium"
                >
                  {{ +(vesting.cliff_amount / 1000000) }}
                </h2>
                <h2 v-else>
                  ...
                </h2>
                <div v-if="vesting && vesting.cliff" class="is-size-7">
                  {{ new Date(vesting.cliff * 1000) | formatDate }}
                </div>
              </div>
            </atropos>
          </div>
          <div class="column is-half">
            <atropos :options="{rotateTouch: false}">
              <div
                class="
                box mb-0
                has-background-black-transparent
                py-5
                bg-dark
                has-radius has-text-centered
              "
                style="height: 100%"
              >
                <div class="has-text-weight-bold subtitle mb-5">
                  Release rate
                </div>
                <h2
                  v-if="vesting && vesting.period && vesting.total_amount"
                  class="title has-text-accent is-5 mb-2 has-text-weight-medium"
                >
                  {{
                    +(
                      (vesting.total_amount - vesting.cliff_amount) /
                      ((vesting.end_time - vesting.start_time) / vesting.period) /
                      1000000
                    ).toFixed(6)
                  }}
                  NOS per {{ vesting.period }}s
                </h2>
                <h2 v-else>
                  ...
                </h2>
                <div v-if="vesting && vesting.period" class="is-size-7">
                  Next unlock {{ nextUnlock }}s
                </div>
              </div>
            </atropos>
          </div>
          <div class="column is-half">
            <atropos :options="{rotateTouch: false}">
              <div
                class="
                box mb-0
                has-background-black-transparent
                py-5
                bg-dark
                has-radius has-text-centered
              "
              >
                <div class="has-text-weight-bold subtitle mb-5">
                  Total Released
                </div>
                <h2 class="title has-text-accent is-5 has-text-weight-medium">
                  <span
                    v-if="
                      vesting &&
                        vesting.withdrawn_amount !== null &&
                        typeof vesting.withdrawn_amount !== 'undefined' &&
                        vesting.total_amount
                    "
                  >{{ +(vesting.withdrawn_amount / 1000000) }} /
                    {{ +(vesting.total_amount / 1000000) }}
                    <span class="has-text-weight-light">NOS</span></span>
                  <span v-else>...</span>
                </h2>
                <progress
                  v-if="
                    vesting &&
                      vesting.withdrawn_amount !== null &&
                      typeof vesting.withdrawn_amount !== 'undefined' &&
                      vesting.total_amount
                  "
                  style="margin:0;"
                  class="progress is-accent"
                  :value="vesting.withdrawn_amount"
                  :max="vesting.total_amount"
                />
              </div>
            </atropos>
          </div>
          <div class="column is-half">
            <atropos :options="{rotateTouch: false}">
              <div
                class="
                box mb-0
                has-background-black-transparent
                py-5
                bg-dark
                has-radius has-text-centered
              "
              >
                <div class="has-text-weight-bold subtitle mb-5">
                  Claimable
                </div>
                <h2 class="title has-text-accent is-5 has-text-weight-medium">
                  <span v-if="vesting && vesting.canceled_at.toNumber()" class="has-text-danger">Cancelled</span>
                  <span
                    v-else-if="
                      releasable !== null && typeof releasable !== 'undefined'
                    "
                  >
                    ~{{ +(releasable / 1000000).toFixed(2) }}
                    <span class="has-text-weight-light">NOS</span>
                  </span>
                  <span v-else>...</span>
                </h2>
                <progress
                  v-if="
                    vesting && releasable !== null && typeof releasable !== 'undefined'
                  "
                  style="margin:0;"
                  class="progress is-accent"
                  :value="(+releasable + +vesting.withdrawn_amount)"
                  :max="vesting.total_amount"
                />
              </div>
            </atropos>
          </div>
        </div>
        <div class="mb-2">
          <div v-if="vesting && vesting.canceled_at.toNumber()" class="button is-medium is-danger is-fullwidth mt-5" disabled>
            Cancelled
          </div>
          <div
            v-else-if="!solWallet"
            class="button is-medium is-accent is-fullwidth mt-5"
            @click="$sol.loginModal = true"
          >
            <strong>Connect Wallet</strong>
          </div>
          <div v-else>
            <form @submit.prevent="claim">
              <button
                class="button is-medium is-accent is-fullwidth mt-5"
                :class="{ 'is-loading': loading }"
                :disabled="
                  loading ||
                    !address ||
                    !solWallet ||
                    !releasable ||
                    releasable < 10000
                "
                type="submit"
              >
                <strong>Claim NOS Tokens</strong>
              </button>
              <div class="has-text-centered mt-2">
                <a
                  class="is-size-6 has-text-danger"
                  @click="$sol.logout"
                >Logout</a>
              </div>
            </form>
          </div>
        </div>
        <div v-if="success" class="notification is-success mb-2">
          <button class="delete" @click="success = null" />
          Transaction sent:
          <a :href="`${explorer}/tx/${success}`" class="is-size-7">{{
            success
          }}</a>
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
import Timelock from '@streamflow/timelock'
import { PublicKey } from '@solana/web3.js'
import {
  BN
} from '@streamflow/timelock/node_modules/@project-serum/anchor'
import ErrorModal from '@/components/ErrorModal'
const Layout = require('@streamflow/timelock/dist/layout')

export default {
  components: {
    ErrorModal
  },

  filters: {
    formatDate (value) {
      if (value) {
        const year = value.getFullYear()
        const month = value.toLocaleString('default', { month: 'long' })
        const day = value.getDate()
        // const seconds = value.getSeconds()
        const minutes = value.getMinutes()
        const hour = value.getHours()
        return `${month} ${day} ${year} - ${hour}:${(minutes < 10 ? '0' : '') +
          minutes}`
      }
    }
  },
  data () {
    return {
      address: this.$route.params.address,
      error: null,
      loading: false,
      success: null,
      refreshReleasable: true,
      explorer: process.env.NUXT_ENV_BLOCKEXPLORER,
      vesting: null
    }
  },

  computed: {
    solWallet () {
      return this.$sol && this.$sol.wallet && this.$sol.wallet.publicKey
        ? this.$sol.wallet.publicKey.toString()
        : null
    },
    releasable () {
      // eslint-disable-next-line
      this.refreshReleasable;
      if (this.vesting) {
        return this.calculateReleasable(
          this.vesting.start_time,
          this.vesting.end_time,
          this.vesting.total_amount,
          this.vesting.withdrawn_amount,
          this.vesting.cliff_amount,
          this.vesting.period
        )
      }
      return null
    },
    nextUnlock () {
      // eslint-disable-next-line
      this.refreshReleasable;
      if (this.vesting) {
        const now = new Date()
        return (
          this.vesting.period -
          parseInt((now.getTime() / 1000) % this.vesting.period)
        )
      }
      return null
    }
  },

  created () {
    if (!this.address) {
      this.error = 'Invalid address'
    } else {
      this.timer = setInterval(() => {
        this.refreshReleasable = !this.refreshReleasable
      }, 1000)
      this.getVestingInfo()
    }
  },

  beforeDestroy () {
    clearInterval(this.timer)
  },

  methods: {
    calculateReleasable (start, end, total, released, cliff, period) {
      const now = new Date()
      if (now.getTime() / 1000 < start) { return 0 }
      const locked = (now.getTime() / 1000) % this.vesting.period
      now.setSeconds(now.getSeconds() - locked)
      const duration = end - start
      const releasable =
        ((+total - +cliff) * (now.getTime() / 1000 - start)) / duration -
        +released +
        +cliff
      return Math.max(0, Math.min(+total - +released, releasable))
    },
    handleError (error) {
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
    async claim () {
      this.loading = true
      try {
        const response = await Timelock.withdraw(
          this.$sol.web3,
          this.$sol.wallet,
          '8e72pYCDaxu3GqMfeQ5r8wFgoZSYk6oua1Qo9XpsZjX',
          new PublicKey(this.address),
          new BN(0)
        )
        this.success = response
        this.getVestingInfo()
      } catch (e) {
        alert('something went wrong')
        this.handleError(e)
      }
      this.loading = false
    },
    async getVestingInfo () {
      this.loading = true
      try {
        const response = await this.$sol.web3.getAccountInfo(
          new PublicKey(this.address)
        )
        this.vesting = Layout.decode(Buffer.from(response.data))
      } catch (error) {
        this.handleError(error)
      }
      this.loading = false
    }
  }
}
</script>

<style lang="scss" scoped>
.blockchain-address {
  color: #1c0039;
  text-overflow: ellipsis;
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  display: block;
}
</style>
