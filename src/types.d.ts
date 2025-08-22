/**
 * Utility Types
 */
declare const __nominal__type: unique symbol;
type Nominal<Type, Identifier> = Type & {
  readonly [__nominal__type]: Identifier;
};

type BaseAccount = { id: string; label: string };

type VPA = `${string}@${string}`;

type NumberString = `${number}.${Digit}${Digit}`;
type Digit = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 0;
type Amount = { currency: 'INR'; value: NumberString };

/**
 * Store
 */

interface IStore {
  open: () => Promise<void>;
  getBucket: (name: string) => Promise<IStoreBucket>;
}
interface IStoreBucket {
  get: (key: string) => Promise<string | null>;
  set: (key: string, val: string) => Promise<void>;
  // del
}

/**
 * PSP Clients
 * Implement this to add more PSPs
 */

interface PSPClient<Acc extends BaseAccount> {
  readonly id: string;

  /**
   * Save the store for later use
   */
  init: ({ store }: { store: IStoreBucket }) => Promise<void>;

  /**
   * Return a list of all added bank accounts
   */
  getAccounts: () => Promise<Acc[]>;

  /**
   * For a given account, return the balance as a NumberString
   */
  getBalance: (account: Acc) => Promise<{
    getCredReqData: GetCredentialInput;
    callback: (getCredRes: GetCredentialResult) => Promise<NumberString>;
  }>;

  /**
   * Lookup a VPA and check if it is valid
   */
  lookupVPA: (
    vpa: VPA
  ) => Promise<{ found: true; name: string } | { found: false; error: string }>;

  /**
   * Pay this VPA. return 2 things:
   * - input for GetCredential
   * - a callback that accepts the response of GetCredential
   */
  payVPA: (
    account: Acc,
    vpa: VPA,
    amount: Amount
  ) => Promise<{
    getCredReqData: GetCredentialInput;
    callback: (
      getCredRes: GetCredentialResult
    ) => Promise<{ status: 'SUCCESS'; rrn: string; txnId: string }>;
  }>;

  /**
   * Return transaction history
   * Types not finalized yet
   */
  getTxnHistory: () => Promise<any>; // TODO: return type

  /**
   * Return a specific transaction
   * Types not finalized yet
   */
  getTxnById: (txnId: string) => Promise<any>; // TODO: return type

  /**
   * Send a collect request to a VPA
   */
  collectVPA: (
    account: Acc,
    params: { vpa: VPA; amount: Amount; note?: string; expiry: Date }
  ) => Promise<{ status: 'SUCCESS'; rrn: string; txnId: string }>;
}

/**
 * Common Lib Functions
 */

type GetChallengeInput = {
  challengeType: 'initial' | 'rotate';
  deviceId: string;
};

type CredType = 'reqBalEnq' | 'pay';
type CredMethodType = 'PIN';
type CredMethodSubType = 'MPIN';
type Salt = Nominal<string, 'Salt'>;

type GetCredentialInput = {
  txnId: string;
  credType: CredType;
  // random: Buffer;
  deviceId: string;
  appId: string;
  mobileNumber: string;
  payerAddr: VPA;
  payeeAddr: VPA;
  txnAmount?: Amount;
  // mPinLength

  // payInfo
  // note?: string;
  // refId?: string;
  // refUrl?: string;
};

type GetCredentialResult = {
  credBlocks: {
    [credMethodSubType in CredMethodSubType]?: {
      [credType in CredType]?: {
        type: CredMethodType;
        subType: CredMethodSubType;
        data: {
          code: string;
          ki: string;
          encryptedBase64String: string;
          hmac?: null;
          oda?: null;
          pid?: null;
          skey?: null;
          type?: null;
        };
      };
    };
  };
};
