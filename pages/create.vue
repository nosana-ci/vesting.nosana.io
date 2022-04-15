<template>
  <div>
    <error-modal />
    <section class="section">
      <div class="container">
        <div class="has-text-centered block">
          <a class href="https://nosana.io" target="_blank">
            <img :src="require('@/assets/img/logo.svg')" width="175" class="mb-4">
          </a>
        </div>
      </div>
    </section>
    <div class="container">
      <div
        class="box is-horizontal-centered has-limited-width px-4 pb-6 pt-5 gradient-block has-border-gradient has-radius"
      >
        <h2 class="title is-2 has-text-centered has-text-weight-medium mb-6 mt-3">
          Vesting Contract
        </h2>
        <form @submit.prevent="createVesting()">
          <label class="label">Amount</label>

          <div class="field has-addons">
            <div class="control is-expanded">
              <input
                v-model="amount"
                required
                class="input"
                type="number"
                step="0.01"
                min="0"
                :max="$sol.balance / 1e6"
                placeholder="Amount in NOS"
              >
            </div>
            <div class="control">
              <a
                class="button"
                @click="amount = ($sol.balance / 1e6).toFixed(2)"
              >Max ({{ ($sol.balance / 1e6).toFixed(2) }} NOS)</a>
            </div>
          </div>

          <div class="field">
            <label class="label">Recipient Address</label>
            <div class="control">
              <input
                v-model="recipient"
                required
                class="input is-primary"
                type="text"
                placeholder="Solana Address"
              >
            </div>
          </div>

          <div class="field is-horizontal">
            <div class="field-body">
              <div class="field">
                <label class="label">Start Date</label>
                <div class="control is-expanded">
                  <input v-model="start_date" :min="now_date" class="input is-primary" type="date">
                </div>
              </div>
              <div class="field">
                <label class="label">Start Time</label>
                <div class="control is-expanded">
                  <input
                    v-model="start_time"
                    :disabled="!start_date"
                    class="input is-primary"
                    type="time"
                  >
                </div>
              </div>
            </div>
          </div>
          <div class="field is-horizontal">
            <div class="field-body">
              <div class="field">
                <label class="label">End Date</label>
                <div class="control is-expanded">
                  <input
                    v-model="end_date"
                    :min="start_date"
                    :disabled="!start_date"
                    class="input is-primary"
                    type="date"
                  >
                </div>
              </div>
              <div class="field">
                <label class="label">End Time</label>
                <div class="control is-expanded">
                  <input
                    v-model="end_time"
                    :disabled="!start_date || !start_time || !end_date"
                    class="input is-primary"
                    type="time"
                  >
                </div>
              </div>
            </div>
          </div>
          <div class="field is-horizontal">
            <div class="field-body">
              <div class="field">
                <label class="label">Cliff Amount</label>
                <div class="control is-expanded">
                  <input
                    v-model="cliffAmount"
                    required
                    class="input"
                    type="number"
                    step="0.01"
                    min="0"
                    :disabled="!amount"
                    :max="amount"
                    placeholder="Amount in NOS"
                  >
                </div>
              </div>
              <div class="field">
                <label class="label">Release Frequency (seconds)</label>
                <div class="control is-expanded">
                  <input
                    v-model="releaseFrequency"
                    required
                    class="input"
                    type="number"
                    step="1"
                    min="1"
                    placeholder="Release frequency in seconds"
                  >
                </div>
              </div>
            </div>
          </div>
          <div class="field">
            <div class="control">
              <button
                v-if="!solWallet"
                class="button is-medium is-accent is-fullwidth mt-5 is-outlined"
                @click.prevent.stop="$sol.loginModal = true"
              >
                <strong>Connect Wallet</strong>
              </button>
              <button
                v-else
                :disabled="loading"
                :class="{ 'is-disabled': loading }"
                class="button is-medium is-accent is-fullwidth mt-5"
                type="submit"
              >
                <strong>Create Vesting Contract</strong>
              </button>
            </div>
          </div>
        </form>
        <div v-if="success" class="notification is-success mb-6">
          <button class="delete" @click="success = null" />
          Transaction sent:
          <a :href="`${explorer}/tx/${success}`" class="is-size-7">
            {{
              success
            }}
          </a>
        </div>
        <p class="has-text-centered mt-6">
          <nuxt-link to="/create-bulk" class="button is-info">
            Bulk Vesting Form
          </nuxt-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import { PublicKey, Keypair } from '@solana/web3.js'
import Timelock from '@streamflow/timelock'
import {
  BN
} from '@streamflow/timelock/node_modules/@project-serum/anchor'
import ErrorModal from '@/components/ErrorModal'

export default {
  components: {
    ErrorModal
  },
  data () {
    const date = new Date()
    let day = date.getDate()
    let month = date.getMonth() + 1
    const year = date.getFullYear()

    if (month < 10) { month = '0' + month }
    if (day < 10) { day = '0' + day }

    const today = year + '-' + month + '-' + day
    return {
      amount: null,
      cliffAmount: 0,
      releaseFrequency: 1,
      recipient: null,
      start_date: null,
      start_time: null,
      end_date: null,
      now_date: today,
      end_time: null,
      loading: false,
      error: null,
      success: null,
      explorer: process.env.NUXT_ENV_BLOCKEXPLORER
    }
  },
  computed: {
    solWallet () {
      return this.$sol && this.$sol.wallet && this.$sol.wallet.publicKey
        ? this.$sol.wallet.publicKey.toString()
        : null
    }
  },
  watch: {
    start_date (newValue, oldValue) {
      const date = new Date()
      let day = date.getDate()
      let month = date.getMonth() + 1
      const year = date.getFullYear()

      if (month < 10) { month = '0' + month }
      if (day < 10) { day = '0' + day }

      const today = year + '-' + month + '-' + day
      if (new Date(newValue) < date) {
        this.start_date = today
      }
      const startDate = new Date(this.start_date)
      date.setHours(0, 0, 0, 0)
      startDate.setHours(0, 0, 0, 0)
      if (date.getTime() === startDate.getTime()) {
        this.start_time = null
      }
    },
    start_time (newValue, oldValue) {
      const now = new Date()
      const hours = now.getHours()
      const minutes = now.getMinutes()
      const startDate = new Date(this.start_date)
      now.setHours(0, 0, 0, 0)
      startDate.setHours(0, 0, 0, 0)
      if (now.getTime() === startDate.getTime()) {
        if (!newValue) {
          this.start_time = hours + ':' + (minutes + 2)
        } else {
          const parts = newValue.split(':')
          if (
            parseInt(parts[0]) < hours ||
            (parseInt(parts[0]) === hours && parseInt(parts[1]) < minutes + 2)
          ) {
            this.start_time = hours + ':' + (minutes + 2)
          }
        }
      }
    },
    end_time (newValue, oldValue) {
      if (this.start_date === this.end_date) {
        if (this.start_time && newValue) {
          const partsStart = this.start_time.split(':')
          const partsEnd = newValue.split(':')
          if (
            parseInt(partsEnd[0]) < parseInt(partsStart[0]) ||
            (parseInt(partsEnd[0]) === parseInt(partsStart[0]) &&
              parseInt(partsEnd[1]) < parseInt(partsStart[1]) + 5)
          ) {
            this.end_time = partsStart[0] + ':' + (parseInt(partsStart[1]) + 5)
          }
        }
      }
    }
  },
  created () {},
  methods: {
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
    async createVesting () {
      this.loading = true
      try {
        /**
         * Creates a new stream/vesting contract. All fees are paid by sender. (escrow metadata account rent, escrow token account, recipient's associated token account creation
         * @param {Connection} connection
         * @param {Wallet} wallet - Wallet signing the transaction.
         * @param {Address} timelockProgramId - Program ID of a timelock program on chain.
         * @param {Keypair} newAcc - New escrow account containing all of the stream/vesting contract metadata.
         * @param {PublicKey} recipient - Solana address of a recipient. Associated token account will be derived from this address and SPL Token mint address.
         * @param {PublicKey} mint - SPL Token mint.
         * @param {BN} depositedAmount - Initially deposited amount of tokens.
         * @param {BN} start - Timestamp (in seconds) when the tokens start vesting
         * @param {BN} end - Timestamp when all tokens are fully vested
         * @param {BN} period - Time step (period) in seconds per which the vesting occurs
         * @param {BN} cliff - Vesting contract "cliff" timestamp
         * @param {BN} cliffAmount - Amount unlocked at the "cliff" timestamp
         */
        const start =
          new Date(this.start_date + 'T' + this.start_time).getTime() / 1e3
        let end = new Date(this.end_date + 'T' + this.end_time).getTime() / 1e3
        if (end === start) {
          end = start + 1
        }
        const escrow = Keypair.generate()
        const amount = new BN(this.amount * Math.pow(10, 6))
        const mint = new PublicKey(process.env.NUXT_ENV_TOKEN_ADDRESS)
        const period = this.releaseFrequency
        const cliff = start
        const cliffAmount = new BN(this.cliffAmount * Math.pow(10, 6))

        const response = await Timelock.create(
          this.$sol.web3,
          this.$sol.wallet,
          '8e72pYCDaxu3GqMfeQ5r8wFgoZSYk6oua1Qo9XpsZjX',
          escrow,
          new PublicKey(this.recipient),
          mint,
          amount,
          new BN(start),
          new BN(end),
          new BN(period),
          new BN(cliff),
          new BN(cliffAmount)
        )
        this.success = response
      } catch (e) {
        alert('something went wrong')
        this.handleError(e)
      }
      this.loading = false
    }
  }
}
</script>
<style>
::-webkit-calendar-picker-indicator {
  filter: invert(1);
}
</style>
<style lang="scss" scoped>
.is-primary {
  color: rgba(255, 255, 255, 0.8);
  &::placeholder {
    color: rgba(255, 255, 255, 0.8);
  }
}
</style>
