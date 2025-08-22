import { UPILib } from '../src';
import { MockPSP } from '../src/psps/mock';
import { JSONFileStore } from '../src/stores/jsonfilestore';

const pspClient = new MockPSP();
const store = new JSONFileStore();
const lib = new UPILib(store, pspClient);
await lib.init();

const accounts = await lib.getAccounts();
console.log({ accounts });
const account = accounts.find((a) => a.id === 'account1');

const balance = await lib.getBalance(account!);
console.log({ balance });
