import assert from 'node:assert';
import { isAmount, isVPA } from '../../utils';

type MockPspAccount = {
  id: string;
  label: string;
  description?: string;
};

const ACCOUNTS: MockPspAccount[] = [
  {
    id: 'account1',
    label: 'Account 1',
    description: 'Set UPI PIN',
  },
  { id: 'account2', label: 'Account 2' },
  { id: 'account3', label: 'Account 3' },
];

export class MockPSP implements PSPClient<MockPspAccount> {
  readonly id = 'MockPSP';
  store: IStoreBucket | null = null;

  constructor() {}

  async init({ store }: { store: IStoreBucket }) {
    this.store = store;
  }

  async getAccounts() {
    return Object.values(ACCOUNTS);
  }

  async getBalance(account: MockPspAccount) {
    if (!account || !ACCOUNTS.find((a) => a.id === account.id))
      throw new Error(`Account not found: ${account?.id}`);

    const getCredReqData: GetCredentialInput = {
      credType: 'reqBalEnq',
      txnId: crypto.randomUUID(),
      appId: 'mock.psp',
      deviceId: crypto.randomUUID(),
      mobileNumber: '9876543210',
      payerAddr: '9876543210@mockpsp',
      payeeAddr: '9876543210@mockpsp',
    };

    return {
      getCredReqData,
      callback: async (getCredRes: GetCredentialResult) => {
        console.log('mockpsp got res from GetCredential:', getCredRes);
        return '12.00' as NumberString;
      },
    };
  }

  async lookupVPA(vpa: VPA) {
    assert.ok(isVPA(vpa), 'Invalid VPA: ' + vpa);
    if (vpa.includes('true')) {
      return { found: true, name: 'Person A' as string } as const;
    } else {
      return { found: false, error: 'Not found.' as string } as const;
    }
  }

  async payVPA(account: MockPspAccount, vpa: VPA, amount: Amount) {
    if (!account || !ACCOUNTS.find((a) => a.id === account.id))
      throw new Error(`Account not found: ${account?.id}`);

    const getCredReqData: GetCredentialInput = {
      credType: 'pay',
      txnId: crypto.randomUUID(),
      appId: 'mock.psp',
      deviceId: crypto.randomUUID(),
      mobileNumber: '9876543210',
      payerAddr: '9876543210@mockpsp',
      payeeAddr: vpa,
      txnAmount: amount,
    };

    return {
      getCredReqData,
      callback: async (getCredRes: GetCredentialResult) => {
        console.log('mockpsp got res from GetCredential:', getCredRes);
        return {
          status: 'SUCCESS' as const,
          rrn: '112233445566',
          txnId: getCredReqData.txnId,
        };
      },
    };
  }

  async getTxnHistory() {
    return [];
  }

  async getTxnById(txnId: string) {
    return { txnId };
  }

  async collectVPA(
    account: MockPspAccount,
    {
      vpa,
      // note,
      // expiry,
      amount,
    }: { vpa: VPA; amount: Amount; note?: string; expiry: Date }
  ) {
    if (!account || !ACCOUNTS.find((a) => a.id === account.id))
      throw new Error(`Account not found: ${account?.id}`);
    assert.ok(isVPA(vpa), 'Invalid VPA: ' + vpa);
    assert.ok(isAmount(amount), 'Invalid Amount: ' + amount);

    return {
      status: 'SUCCESS' as const,
      rrn: '112233445566',
      txnId: crypto.randomUUID(),
    };
  }
}
