"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateClient = void 0;
const eventemitter3_1 = __importDefault(require("eventemitter3"));
const camelcase_1 = __importDefault(require("camelcase"));
const web3_js_1 = require("@solana/web3.js");
const provider_js_1 = require("../../provider.js");
const index_js_1 = require("../../coder/index.js");
const common_js_1 = require("../common.js");
const pubkey_js_1 = require("../../utils/pubkey.js");
const instruction_js_1 = __importDefault(require("./instruction.js"));
const rpc_js_1 = __importDefault(require("./rpc.js"));
const transaction_js_1 = __importDefault(require("./transaction.js"));
class StateFactory {
    static build(idl, coder, programId, provider) {
        if (idl.state === undefined) {
            return undefined;
        }
        return new StateClient(idl, programId, provider, coder);
    }
}
exports.default = StateFactory;
/**
 * A client for the program state. Similar to the base [[Program]] client,
 * one can use this to send transactions and read accounts for the state
 * abstraction.
 */
class StateClient {
    constructor(idl, programId, 
    /**
     * Returns the client's wallet and network provider.
     */
    provider = (0, provider_js_1.getProvider)(), 
    /**
     * Returns the coder.
     */
    coder = new index_js_1.BorshCoder(idl)) {
        this.provider = provider;
        this.coder = coder;
        this._idl = idl;
        this._programId = programId;
        this._address = programStateAddress(programId);
        this._sub = null;
        // Build namespaces.
        const [instruction, transaction, rpc] = (() => {
            var _a;
            let instruction = {};
            let transaction = {};
            let rpc = {};
            (_a = idl.state) === null || _a === void 0 ? void 0 : _a.methods.forEach((m) => {
                // Build instruction method.
                const ixItem = instruction_js_1.default.build(m, (ixName, ix) => coder.instruction.encodeState(ixName, ix), programId);
                ixItem["accounts"] = (accounts) => {
                    const keys = stateInstructionKeys(programId, provider, m, accounts);
                    return keys.concat(instruction_js_1.default.accountsArray(accounts, m.accounts, m.name));
                };
                // Build transaction method.
                const txItem = transaction_js_1.default.build(m, ixItem);
                // Build RPC method.
                const rpcItem = rpc_js_1.default.build(m, txItem, (0, common_js_1.parseIdlErrors)(idl), provider);
                // Attach them all to their respective namespaces.
                const name = (0, camelcase_1.default)(m.name);
                instruction[name] = ixItem;
                transaction[name] = txItem;
                rpc[name] = rpcItem;
            });
            return [
                instruction,
                transaction,
                rpc,
            ];
        })();
        this.instruction = instruction;
        this.transaction = transaction;
        this.rpc = rpc;
    }
    /**
     * Returns the program ID owning the state.
     */
    get programId() {
        return this._programId;
    }
    /**
     * Returns the deserialized state account.
     */
    async fetch() {
        const addr = this.address();
        const accountInfo = await this.provider.connection.getAccountInfo(addr);
        if (accountInfo === null) {
            throw new Error(`Account does not exist ${addr.toString()}`);
        }
        // Assert the account discriminator is correct.
        const state = this._idl.state;
        if (!state) {
            throw new Error("State is not specified in IDL.");
        }
        const expectedDiscriminator = await (0, index_js_1.stateDiscriminator)(state.struct.name);
        if (expectedDiscriminator.compare(accountInfo.data.slice(0, 8))) {
            throw new Error("Invalid account discriminator");
        }
        return this.coder.state.decode(accountInfo.data);
    }
    /**
     * Returns the state address.
     */
    address() {
        return this._address;
    }
    /**
     * Returns an `EventEmitter` with a `"change"` event that's fired whenever
     * the state account cahnges.
     */
    subscribe(commitment) {
        if (this._sub !== null) {
            return this._sub.ee;
        }
        const ee = new eventemitter3_1.default();
        const listener = this.provider.connection.onAccountChange(this.address(), (acc) => {
            const account = this.coder.state.decode(acc.data);
            ee.emit("change", account);
        }, commitment);
        this._sub = {
            ee,
            listener,
        };
        return ee;
    }
    /**
     * Unsubscribes to state changes.
     */
    unsubscribe() {
        if (this._sub !== null) {
            this.provider.connection
                .removeAccountChangeListener(this._sub.listener)
                .then(async () => {
                this._sub = null;
            })
                .catch(console.error);
        }
    }
}
exports.StateClient = StateClient;
// Calculates the deterministic address of the program's "state" account.
function programStateAddress(programId) {
    let [registrySigner] = (0, pubkey_js_1.findProgramAddressSync)([], programId);
    return (0, pubkey_js_1.createWithSeedSync)(registrySigner, "unversioned", programId);
}
// Returns the common keys that are prepended to all instructions targeting
// the "state" of a program.
function stateInstructionKeys(programId, provider, m, accounts) {
    if (m.name === "new") {
        // Ctor `new` method.
        const [programSigner] = (0, pubkey_js_1.findProgramAddressSync)([], programId);
        return [
            {
                pubkey: provider.wallet.publicKey,
                isWritable: false,
                isSigner: true,
            },
            {
                pubkey: programStateAddress(programId),
                isWritable: true,
                isSigner: false,
            },
            { pubkey: programSigner, isWritable: false, isSigner: false },
            {
                pubkey: web3_js_1.SystemProgram.programId,
                isWritable: false,
                isSigner: false,
            },
            { pubkey: programId, isWritable: false, isSigner: false },
        ];
    }
    else {
        (0, common_js_1.validateAccounts)(m.accounts, accounts);
        return [
            {
                pubkey: programStateAddress(programId),
                isWritable: true,
                isSigner: false,
            },
        ];
    }
}
//# sourceMappingURL=state.js.map