import assert from 'node:assert';
import { isVPA } from './utils';
import { CommonLibrary } from './commonlib';

export class UPILib<Store extends IStore, Acc extends BaseAccount> {
  store: Store;
  commonLib: CommonLibrary;
  pspClient: PSPClient<Acc>;
  pin?: string | (() => Promise<string>);

  constructor(store: Store, pspClient: PSPClient<Acc>) {
    assert.ok(store, 'a store is required.');
    assert.ok(pspClient.id, 'pspClient has no id.');
    this.store = store;
    this.commonLib = new CommonLibrary();
    this.pspClient = pspClient;
  }

  /**
   * Initialize the library (opening stores, etc.)
   * Call once before using anything else.
   */
  async init() {
    await this.store.open();

    await this.commonLib.init({
      store: await this.store.getBucket('commonLib'),
    });

    await this.pspClient.init({
      store: await this.store.getBucket('pspClient/' + this.pspClient.id),
    });
  }

  /**
   * Get all linked bank accounts
   */
  async getAccounts() {
    return this.pspClient.getAccounts();
  }

  /**
   * Get balance of an account
   * Get an account object from `getAccounts`.
   */
  async getBalance(account: Acc) {
    assert.ok(this.pin, 'PIN required.');

    const { getCredReqData, callback } = await this.pspClient.getBalance(
      account
    );

    const pin = typeof this.pin === 'function' ? await this.pin() : this.pin;

    const getCredRes = await this.commonLib.getCredential(getCredReqData, pin);

    const balance = await callback(getCredRes);

    return balance;
  }

  /**
   * Look up a VPA and get info if it exists
   */
  async lookupVPA(vpa: VPA) {
    assert.ok(isVPA(vpa), 'Invalid VPA: ' + vpa);
    return this.pspClient.lookupVPA(vpa);
  }

  /**
   * Pay a VPA
   */
  async payVPA(account: Acc, vpa: VPA, amount: Amount) {
    assert.ok(this.pin, 'PIN required.');

    const { getCredReqData, callback } = await this.pspClient.payVPA(
      account,
      vpa,
      amount
    );

    const pin = typeof this.pin === 'function' ? await this.pin() : this.pin;

    const getCredRes = await this.commonLib.getCredential(getCredReqData, pin);

    return await callback(getCredRes);
  }

  /**
   * Get Transaction history
   * Warning: unstable API, will likely change in future.
   */
  async getTxnHistory() {
    // TODO: filters?
    return this.pspClient.getTxnHistory();
  }

  /**
   * Get transaction by ID
   * Warning: unstable API, will likely change in future.
   */
  async getTxnById(txnId: string) {
    assert.ok(txnId, 'Invalid txnId: ' + txnId);
    return this.pspClient.getTxnById(txnId);
  }

  /**
   * Send a Collect request to a VPA
   */
  async collectVPA(
    account: Acc,
    params: {
      vpa: VPA;
      amount: Amount;
      note?: string;
      expiry: Date;
    }
  ) {
    return this.pspClient.collectVPA(account, params);
  }
}
