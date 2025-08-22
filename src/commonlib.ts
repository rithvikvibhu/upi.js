import crypto from 'node:crypto';
import assert from 'node:assert';
import { CL_VERSION, NPCI_KEY, SIGNER_CRT } from './constants';
import {
  aesGcm256Encrypt,
  rsaEncryptForCertificate,
  rsaEncryptForPubKey,
} from './utils';

export class CommonLibrary {
  store: CommonLibStore | null = null;

  async init({ store }: { store: IStoreBucket }) {
    this.store = new CommonLibStore(store);

    const token = await this.store.getToken();
    if (!token) {
      this.store.setToken(crypto.randomBytes(32).toString('hex'));
    }

    const k0 = await this.store.getK0();
    if (!k0) {
      this.store.setK0(crypto.randomBytes(32).toString('hex'));
    }
  }

  async getChallenge({ challengeType, deviceId }: GetChallengeInput) {
    assert.ok(
      typeof deviceId === 'string' && deviceId.length == 32,
      'deviceId must be a 64 char hex string.'
    );

    const token = await this.store?.getToken();
    const k0 = await this.store?.getK0();
    assert.ok(token, 'token must be available.');
    assert.ok(k0, 'K0 must be available.');

    if (challengeType === 'initial') {
      const data = token + '|' + k0 + '|' + deviceId;
      const encrypted = rsaEncryptForCertificate(data, SIGNER_CRT);
      return CL_VERSION + '|' + encrypted.toString('base64');
    }

    // TODO: rotate challengeType

    throw new Error('Invalid challenge type: ' + challengeType);
  }

  async getCredential(
    reqData: GetCredentialInput,
    pin: string
  ): Promise<GetCredentialResult> {
    const k0 = await this.store?.getK0();
    assert.ok(k0, 'No K0 set.');

    // Create a salt
    const salt = createSalt({
      txnAmount: reqData.txnAmount,
      txnId: reqData.txnId,
      payerAddr: reqData.payerAddr,
      payeeAddr: reqData.payeeAddr,
      appId: reqData.appId,
      mobileNumber: reqData.mobileNumber,
      deviceId: reqData.deviceId,
      credType: reqData.credType,
    });

    // Encrypt the salt's hash
    const encryptedSalthash = encryptSalthash(
      reqData.txnId,
      pin,
      salt,
      Buffer.from(k0, 'hex')
    );

    // Encrypt for NPCI
    const encryptedForNPCI = rsaEncryptForPubKey(
      encryptedSalthash,
      NPCI_KEY.publicKey
    ).toString('base64');

    const res: GetCredentialResult = {
      credBlocks: {
        // Only support PIN-MPIN credMethod for now
        MPIN: {
          [reqData.credType]: {
            type: 'PIN',
            subType: 'MPIN',
            data: {
              code: NPCI_KEY.code,
              ki: NPCI_KEY.ki,
              encryptedBase64String: CL_VERSION + '|' + encryptedForNPCI,
            },
          },
        },
      },
    };

    return res;
  }
}

class CommonLibStore {
  store: IStoreBucket;

  constructor(store: IStoreBucket) {
    assert.ok(store, 'Store is required.');
    this.store = store;
  }

  async getToken() {
    return this.store.get('token') ?? null;
  }
  async setToken(val: string) {
    await this.store?.set('token', val);
  }

  async getK0() {
    return this.store.get('k0') ?? null;
  }
  async setK0(val: string) {
    await this.store.set('k0', val);
  }
}

/**
 * Utils
 */

function createSalt(obj: {
  txnAmount?: Amount;
  txnId: string;
  payerAddr: string;
  payeeAddr: string;
  appId: string;
  mobileNumber: string;
  deviceId: string;
  credType: string;
}) {
  // "{[txnAmount]|[txnId]|[payerAddr]|[payeeAddr]|[appId]|[mobileNumber]|[deviceId]|[credType]}"
  const {
    txnAmount,
    txnId,
    payerAddr,
    payeeAddr,
    appId,
    mobileNumber,
    deviceId,
    credType,
  } = obj;
  return `${
    txnAmount?.value || ''
  }|${txnId}|${payerAddr}|${payeeAddr}|${appId}|${mobileNumber}|${deviceId}|${credType}` as Salt;
}

function encryptSalthash(
  txnId: string,
  credential: string,
  salt: Salt,
  key: Buffer
) {
  const iv = crypto.randomBytes(16);

  const hasher = new Bun.CryptoHasher('sha256');
  hasher.update(iv);
  hasher.update(Buffer.from(salt, 'utf-8'));
  const saltHash = hasher.digest();

  const encryptedSalthash = aesGcm256Encrypt(saltHash, key, iv);

  return `${credential}|${txnId}|${encryptedSalthash.toString(
    'base64'
  )}|${iv.toString('base64')}`;
}
