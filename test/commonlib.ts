import crypto from 'node:crypto';
import { JSONFileStore } from '../src/stores/jsonfilestore';
import { CommonLibrary } from '../src/commonlib';

const store = new JSONFileStore();
await store.open();

const lib = new CommonLibrary();
await lib.init({ store: await store.getBucket('commonLib') });

const deviceId = crypto.randomBytes(16).toString('hex');

const challenge = await lib.getChallenge({
  challengeType: 'initial',
  deviceId,
});

console.log({ challenge, urlencoded: encodeURIComponent(challenge) });
