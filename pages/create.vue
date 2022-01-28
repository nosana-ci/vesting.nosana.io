<template>
  <div>
    <error-modal />
    <section class="section">
      <div class="container">
        <div class="has-text-centered block">
          <a class="" href="https://nosana.io" target="_blank">
            <img
              :src="require('@/assets/img/logo.svg')"
              width="175"
              class="mb-4"
            />
          </a>
        </div>
      </div>
    </section>
    <div class="container">
      <div
        class="
          box
          is-horizontal-centered
          has-limited-width
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
        <form @submit.prevent="createVesting()">
          <div class="field">
            <label class="label">Amount</label>
            <div class="control">
              <input
                v-model="amount"
                class="input"
                type="number"
                step="0.01"
                min="0"
                placeholder="Amount in NOS"
              />
            </div>
          </div>

          <div class="field">
            <label class="label">Recipient Address</label>
            <div class="control">
              <input
                v-model="recipient"
                class="input is-primary"
                type="text"
                placeholder="Solana Address"
              />
            </div>
          </div>

          <div class="field is-horizontal">
            <div class="field-body">
              <div class="field">
                <label class="label">Start Date</label>
                <div class="control is-expanded">
                  <input
                    v-model="start_date"
                    class="input is-primary"
                    type="date"
                  />
                </div>
              </div>
              <div class="field">
                <label class="label">Start Time</label>
                <div class="control is-expanded">
                  <input
                    v-model="start_time"
                    class="input is-primary"
                    type="time"
                  />
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
                    class="input is-primary"
                    type="date"
                  />
                </div>
              </div>
              <div class="field">
                <label class="label">End Time</label>
                <div class="control is-expanded">
                  <input
                    v-model="end_time"
                    class="input is-primary"
                    type="time"
                  />
                </div>
              </div>
            </div>
          </div>

          <div class="field">
            <div class="control">
              <button
                v-if="!solWallet"
                class="button is-medium is-accent is-fullwidth mt-5"
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
          <a :href="`${explorer}/tx/${success}`" class="is-size-7">{{
            success
          }}</a>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { PublicKey, Keypair } from "@solana/web3.js";
import Timelock from "@streamflow/timelock";
import ErrorModal from "@/components/ErrorModal";
import {
  Address,
  BN
} from "@streamflow/timelock/node_modules/@project-serum/anchor";

export default {
  components: {
    ErrorModal
  },
  created() {},
  computed: {
    solWallet() {
      return this.$sol && this.$sol.wallet && this.$sol.wallet.publicKey
        ? this.$sol.wallet.publicKey.toString()
        : null;
    }
  },
  data() {
    return {
      amount: null,
      recipient: null,
      start_date: null,
      start_time: null,
      end_date: null,
      end_time: null,
      loading: false,
      error: null,
      success: null,
      explorer: process.env.NUXT_ENV_BLOCKEXPLORER
    };
  },

  methods: {
    handleError(error) {
      console.error(error);
      if (error.response && error.response.data) {
        if (error.response.data.error) {
          this.error = error.response.data.error;
        } else if (error.response.data.message) {
          this.error = error.response.data.message;
        } else {
          this.error = error.response.data;
        }
      } else if (error.message) {
        this.error = error.message;
      } else {
        this.error = error;
      }
    },
    async createVesting() {
      this.loading = true;
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
        console.log(this.start_date, this.start_time);
        const start =
          new Date(this.start_date + "T" + this.start_time).getTime() / 1e3;
        let end = new Date(this.end_date + "T" + this.end_time).getTime() / 1e3;
        if (end === start) {
          end = start + 1;
        }
        console.log("START", start);
        console.log("END", end);
        const escrow = Keypair.generate();
        const amount = new BN(this.amount * Math.pow(10, 6));
        const mint = new PublicKey(process.env.NUXT_ENV_TOKEN_ADDRESS);
        const period = 1;
        const cliff = start;
        const cliff_amount = 0;

        const response = await Timelock.create(
          this.$sol.web3,
          this.$sol.wallet,
          "8e72pYCDaxu3GqMfeQ5r8wFgoZSYk6oua1Qo9XpsZjX",
          escrow,
          new PublicKey(this.recipient),
          mint,
          amount,
          new BN(start),
          new BN(end),
          new BN(period),
          new BN(cliff),
          new BN(cliff_amount)
        );
        this.success = response;
      } catch (e) {
        alert("something went wrong");
        this.handleError(e);
      }
      this.loading = false;
    }
  }
};
</script>

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
