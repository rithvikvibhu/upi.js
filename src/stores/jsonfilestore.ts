import { homedir } from 'node:os';
import path from 'node:path';
import { JSONFilePreset } from 'lowdb/node';
import type { Low } from 'lowdb';

// First level for bucket name
type StoreData = Record<string, Record<string, string | undefined> | undefined>;

export class JSONFileStore implements IStore {
  filepath: string;
  db: Low<StoreData> | null;

  constructor(filepath?: string) {
    this.filepath = filepath ?? path.resolve(homedir(), '.upi.js.json');
    this.db = null;
  }

  async open() {
    this.db = await JSONFilePreset<StoreData>(this.filepath, {});
  }

  async getBucket(name: string) {
    return new StoreBucket(this, name);
  }
}

class StoreBucket implements IStoreBucket {
  store: JSONFileStore;
  name: string;

  constructor(store: JSONFileStore, name: string) {
    this.store = store;
    this.name = name;
  }

  async get(key: string) {
    const bucket = this.store.db?.data[this.name];
    if (!bucket) return null;
    return bucket?.[key] ?? null;
  }

  async set(key: string, val: any) {
    this.store.db?.update((data) => {
      if (data[this.name] === undefined) data[this.name] = {};
      const bucket = data[this.name]!;
      bucket[key] = val;
    });
  }

  // TODO
  // del(key: string) {}
}
