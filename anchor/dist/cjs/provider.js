'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.getProvider = exports.setProvider = void 0;
const web3_js_1 = require('@solana/web3.js');
const index_js_1 = require('./utils/bytes/index.js');
const common_js_1 = require('./utils/common.js');
/**
 * The network and wallet context used to send transactions paid for and signed
 * by the provider.
 */
class Provider {
  /**
     * @param connection The cluster connection where the program is deployed.
     * @param wallet     The wallet used to pay for and sign all transactions.
     * @param opts       Transaction confirmation options to use by default.
     */
  constructor (connection, wallet, opts) {
    this.connection = connection;
    this.wallet = wallet;
    this.opts = opts;
  }

  static defaultOptions () {
    return {
      preflightCommitment: 'processed',
      commitment: 'processed'
    };
  }

  /**
     * Returns a `Provider` with a wallet read from the local filesystem.
     *
     * @param url  The network cluster url.
     * @param opts The default transaction confirmation options.
     *
     * (This api is for Node only.)
     */
  static local (url, opts) {
    if (common_js_1.isBrowser) {
      throw new Error('Provider local is not available on browser.');
    }
    opts = opts !== null && opts !== void 0 ? opts : Provider.defaultOptions();
    const connection = new web3_js_1.Connection(url !== null && url !== void 0 ? url : 'http://localhost:8899', opts.preflightCommitment);
    const NodeWallet = require('./nodewallet.js').default;
    const wallet = NodeWallet.local();
    return new Provider(connection, wallet, opts);
  }

  /**
     * Returns a `Provider` read from the `ANCHOR_PROVIDER_URL` environment
     * variable
     *
     * (This api is for Node only.)
     */
  static env () {
    if (common_js_1.isBrowser) {
      throw new Error('Provider env is not available on browser.');
    }
    const process = require('process');
    const url = process.env.ANCHOR_PROVIDER_URL;
    if (url === undefined) {
      throw new Error('ANCHOR_PROVIDER_URL is not defined');
    }
    const options = Provider.defaultOptions();
    const connection = new web3_js_1.Connection(url, options.commitment);
    const NodeWallet = require('./nodewallet.js').default;
    const wallet = NodeWallet.local();
    return new Provider(connection, wallet, options);
  }

  /**
     * Sends the given transaction, paid for and signed by the provider's wallet.
     *
     * @param tx      The transaction to send.
     * @param signers The set of signers in addition to the provider wallet that
     *                will sign the transaction.
     * @param opts    Transaction confirmation options.
     */
  async send (tx, signers, opts) {
    let _a;
    if (signers === undefined) {
      signers = [];
    }
    if (opts === undefined) {
      opts = this.opts;
    }
    tx.feePayer = this.wallet.publicKey;
    tx.recentBlockhash = (await this.connection.getLatestBlockhash(opts.preflightCommitment)).blockhash;
    tx = await this.wallet.signTransaction(tx);
    signers
      .filter(s => s !== undefined)
      .forEach((kp) => {
        tx.partialSign(kp);
      });
    const rawTx = tx.serialize();
    try {
      return await sendAndConfirmRawTransaction(this.connection, rawTx, opts);
    } catch (err) {
      // thrown if the underlying 'confirmTransaction' encounters a failed tx
      // the 'confirmTransaction' error does not return logs so we make another rpc call to get them
      if (err instanceof ConfirmError) {
        // choose the shortest available commitment for 'getTransaction'
        // (the json RPC does not support any shorter than "confirmed" for 'getTransaction')
        // because that will see the tx sent with `sendAndConfirmRawTransaction` no matter which
        // commitment `sendAndConfirmRawTransaction` used
        const failedTx = await this.connection.getTransaction(index_js_1.bs58.encode(tx.signature), { commitment: 'confirmed' });
        if (!failedTx) {
          throw err;
        } else {
          const logs = (_a = failedTx.meta) === null || _a === void 0 ? void 0 : _a.logMessages;
          throw !logs ? err : new web3_js_1.SendTransactionError(err.message, logs);
        }
      } else {
        throw err;
      }
    }
  }

  /**
     * Similar to `send`, but for an array of transactions and signers.
     */
  async sendAll (reqs, opts) {
    if (opts === undefined) {
      opts = this.opts;
    }
    const blockhash = await this.connection.getLatestBlockhash(opts.preflightCommitment);
    const txs = reqs.map((r) => {
      const tx = r.tx;
      let signers = r.signers;
      if (signers === undefined) {
        signers = [];
      }
      tx.feePayer = this.wallet.publicKey;
      tx.recentBlockhash = blockhash.blockhash;
      signers
        .filter(s => s !== undefined)
        .forEach((kp) => {
          tx.partialSign(kp);
        });
      return tx;
    });
    const signedTxs = await this.wallet.signAllTransactions(txs);
    const sigs = [];
    for (let k = 0; k < txs.length; k += 1) {
      const tx = signedTxs[k];
      const rawTx = tx.serialize();
      sigs.push(await sendAndConfirmRawTransaction(this.connection, rawTx, opts));
    }
    return sigs;
  }

  /**
     * Simulates the given transaction, returning emitted logs from execution.
     *
     * @param tx      The transaction to send.
     * @param signers The set of signers in addition to the provdier wallet that
     *                will sign the transaction.
     * @param opts    Transaction confirmation options.
     */
  async simulate (tx, signers, opts = this.opts) {
    let _a, _b, _c;
    if (signers === undefined) {
      signers = [];
    }
    tx.feePayer = this.wallet.publicKey;
    tx.recentBlockhash = (await this.connection.getLatestBlockhash((_a = opts.preflightCommitment) !== null && _a !== void 0 ? _a : this.opts.preflightCommitment)).blockhash;
    tx = await this.wallet.signTransaction(tx);
    signers
      .filter(s => s !== undefined)
      .forEach((kp) => {
        tx.partialSign(kp);
      });
    return await simulateTransaction(this.connection, tx, (_c = (_b = opts.commitment) !== null && _b !== void 0 ? _b : this.opts.commitment) !== null && _c !== void 0 ? _c : 'processed');
  }
}
exports.default = Provider;
// Copy of Connection.simulateTransaction that takes a commitment parameter.
async function simulateTransaction (connection, transaction, commitment) {
  // @ts-ignore
  transaction.recentBlockhash = await connection._recentBlockhash(
    // @ts-ignore
    connection._disableBlockhashCaching);
  const signData = transaction.serializeMessage();
  // @ts-ignore
  const wireTransaction = transaction._serialize(signData);
  const encodedTransaction = wireTransaction.toString('base64');
  const config = { encoding: 'base64', commitment };
  const args = [encodedTransaction, config];
  // @ts-ignore
  const res = await connection._rpcRequest('simulateTransaction', args);
  if (res.error) {
    throw new Error('failed to simulate transaction: ' + res.error.message);
  }
  return res.result;
}
// Copy of Connection.sendAndConfirmRawTransaction that throws
// a better error if 'confirmTransaction` returns an error status
async function sendAndConfirmRawTransaction (connection, rawTransaction, options) {
  const sendOptions = options && {
    skipPreflight: options.skipPreflight,
    preflightCommitment: options.preflightCommitment || options.commitment
  };
  const signature = await connection.sendRawTransaction(rawTransaction, sendOptions);
  const status = (await connection.confirmTransaction(signature, options && options.commitment)).value;
  if (status.err) {
    throw new ConfirmError(`Raw transaction ${signature} failed (${JSON.stringify(status)})`);
  }
  return signature;
}
class ConfirmError extends Error {
  constructor (message) {
    super(message);
  }
}
/**
 * Sets the default provider on the client.
 */
function setProvider (provider) {
  _provider = provider;
}
exports.setProvider = setProvider;
/**
 * Returns the default provider being used by the client.
 */
function getProvider () {
  if (_provider === null) {
    return Provider.local();
  }
  return _provider;
}
exports.getProvider = getProvider;
// Global provider used as the default when a provider is not given.
let _provider = null;
// # sourceMappingURL=provider.js.map
