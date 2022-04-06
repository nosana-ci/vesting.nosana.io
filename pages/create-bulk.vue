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
        <h2 class="title is-2 has-text-centered has-text-weight-medium mt-3">
          Bulk Vesting Contracts
        </h2>
        <div class="file is-accent is-justify-content-center mb-2">
          <label class="file-label">
            <input
              id="csvvestings"
              class="file-input"
              type="file"
              name="csvvestings"
              @change="uploadFile"
            >
            <span class="file-cta">
              <span class="file-label">Choose a .csv file…</span>
            </span>
          </label>
        </div>
        <div
          v-for="(vesting, index) in vestings"
          :key="vesting.recipient + index"
          class="box is-info is-clickable"
          @click="active !== index ? (active = index) : (active = null)"
        >
          <div class="is-flex is-flex-wrap-wrap is-align-items-center">
            <h3 class="subtitle m-0 is-6">
              {{ +(vesting.amount) }}
              <span class="has-text-accent">NOS</span>
            </h3>
            <div class="is-size-7 has-overflow-ellipses mr-4" style="margin-left: auto">
              <span class="has-text-white">recipient</span>
              {{ vesting.recipient }}
            </div>
            <div>
              <i
                class="fas"
                :class="{ 'fa-minus': active === index, 'fa-plus': active !== index }"
              />
            </div>
          </div>
          <div v-if="active === index">
            <ul class="columns is-multiline mt-1">
              <li class="column is-6 py-0">
                start: {{ vesting.start_date }} {{ vesting.start_time }}
              </li>
              <li class="column is-6 py-0">
                start UTC: {{ new Date(vesting.start_date + "T" + vesting.start_time).toUTCString() }}
              </li>
              <li class="column is-6 py-0">
                end: {{ vesting.end_date }} {{ vesting.end_time }}
              </li>
              <li class="column is-6 py-0">
                end UTC: {{ new Date(vesting.end_date + "T" + vesting.end_time).toUTCString() }}
              </li>
              <li class="column is-6 py-0">
                cliff amount: {{ vesting.cliffAmount }} NOS
              </li>
              <li class="column is-6 py-0">
                release frequence: {{ vesting.releaseFrequency }} second(s)
              </li>
            </ul>
            <div class="has-text-right">
              <span v-if="Object.keys(sent).includes(index.toString())" class="has-text-success">
                Sent!:
                <a
                  target="_blank"
                  :href="`${explorer}/tx/${sent[index]}`"
                  class="is-size-7"
                  @click.stop
                >
                  {{
                    sent[index]
                  }}
                </a>
              </span>
              <button
                v-else-if="!solWallet"
                class="button is-accent is-outlined"
                @click.prevent.stop="$sol.loginModal = true"
              >
                <strong>Connect Wallet</strong>
              </button>
              <button
                v-else
                :disabled="loading"
                :class="{ 'is-disabled': loading }"
                class="button is-accent"
                @click.prevent.stop="createVesting(vesting, index)"
              >
                <strong>Create Vesting Contract</strong>
              </button>
            </div>
          </div>
        </div>
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
          <nuxt-link to="/create" class="button is-info">
            Single Vesting Form
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

function csvToJson (string, headers, quoteChar = '"', delimiter = ',') {
  const regex = new RegExp(
    `\\s*(${quoteChar})?(.*?)\\1\\s*(?:${delimiter}|$)`,
    'gs'
  )
  const match = string =>
    [...string.matchAll(regex)]
      .map(match => match[2])
      .filter((_, i, a) => i < a.length - 1) // cut off blank match at end
  const lines = string.split('\n')
  const heads = headers || match(lines.splice(0, 1)[0])
  return lines.map(line =>
    match(line).reduce(
      (acc, cur, i) => ({
        ...acc,
        [heads[i] || `extra_${i}`]: cur.length > 0 ? Number(cur) || cur : null
      }),
      {}
    )
  )
}

export default {
  components: {
    ErrorModal
  },
  data () {
    return {
      loading: false,
      error: null,
      success: null,
      active: null,
      sent: {},
      explorer: process.env.NUXT_ENV_BLOCKEXPLORER,
      vestings: null
    }
  },
  computed: {
    solWallet () {
      return this.$sol && this.$sol.wallet && this.$sol.wallet.publicKey
        ? this.$sol.wallet.publicKey.toString()
        : null
    }
  },
  created () {},

  methods: {
    uploadFile (event) {
      if (event.target.files[0]) {
        try {
          this.vestings = []
          this.sent = {}
          const reader = new FileReader()
          reader.onload = (e) => {
            const content = csvToJson(e.target.result)
            content.forEach((element) => {
              this.vestings.push(element)
            })
            document.getElementById('csvvestings').value = ''
          }
          reader.readAsText(event.target.files[0])
        } catch (e) {
          document.getElementById('csvvestings').value = ''
          this.handleError(e)
        }
      }
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
    async createVesting (vesting, index) {
      this.success = null
      this.error = null
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
          new Date(vesting.start_date + 'T' + vesting.start_time).getTime() /
          1e3
        let end =
          new Date(vesting.end_date + 'T' + vesting.end_time).getTime() / 1e3
        if (end === start) {
          end = start + 1
        }
        const escrow = Keypair.generate()
        const amount = new BN(vesting.amount * Math.pow(10, 6))
        const mint = new PublicKey(process.env.NUXT_ENV_TOKEN_ADDRESS)
        const period = vesting.releaseFrequency
        const cliff = start
        const cliffAmount = new BN(vesting.cliffAmount * Math.pow(10, 6))

        const response = await Timelock.create(
          this.$sol.web3,
          this.$sol.wallet,
          '8e72pYCDaxu3GqMfeQ5r8wFgoZSYk6oua1Qo9XpsZjX',
          escrow,
          new PublicKey(vesting.recipient),
          mint,
          amount,
          new BN(start),
          new BN(end),
          new BN(period),
          new BN(cliff),
          new BN(cliffAmount)
        )
        this.success = response
        this.$set(this.sent, index, response)
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
.bg-dark {
  background-image: url("~assets/img/bg.jpg");
  color: white;
  .title,
  .subtitle {
    color: white;
  }
}
.is-primary {
  color: rgba(255, 255, 255, 0.8);
  &::placeholder {
    color: rgba(255, 255, 255, 0.8);
  }
}
</style>
