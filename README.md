# upi.js

A collection of tools to help integrate UPI.

## UPI Lib

This is a library that provides a common interface to perform UPI operations, backed by pluggable PSPs (Payment Service Providers).

> For the sake of simplicity, 3rd party apps are also considered PSPs.

Can be used to:

- Login to PSP accounts
- View linked bank accounts
- Pay
- Collect

> [!NOTE]
> This package aims to be an entry point for integrating UPI in general. If you're looking for CommonLibrary specifically, [52-1ab](https://52-1ab.github.io/) has published an independent implementation of it written in Go, with bindings for many languages. Check it out [here](https://github.com/52-1ab/cl)!

## Install

```sh
bun add upi.js
```

## Usage

Start with:

```ts
// Use one of the PSPs (or bring your own)
import { MockPsp } from 'upi.js/psps';
const pspClient = new MockPsp();

// Use one of the stores (or bring your own)
import { JSONFileStore } from 'upi.js/stores';
const store = new JSONFileStore();

// Initialize the library
const lib = new UPILib(store, pspClient);
await lib.init();

// (optional) for methods that require pin:
lib.pin = '1234'; // or a function that returns pin
```

Then call its methods:

```ts
// Get Accounts
const accounts = await lib.getAccounts();
const account = accounts[0];

// Get Balance
const balance = await lib.getBalance(account);
// returns: '12.00'

// Lookup VPA
await lib.lookupVPA('foo@hdfcbank');
// returns: {found: true, name: 'Full Name'}

// Pay
await lib.payVPA(account, 'foo@hdfcbank', {
  currency: 'INR',
  value: '15.00',
});

// Collect
await lib.collectVPA(account, {
  vpa: 'foo@hdfcbank',
  amount: { currency: 'INR', value: '15.00' },
  expiry: new Date(+new Date() + 1000 * 3600 * 1), // 1hr in future
  note: 'for pizza',
});
```

To install dependencies:

```bash
bun install
```

<!-- CLI:
```bash
bun bin/run.js
``` -->

## Writing PSP Clients

To write a PSP client, you need to implement the `PSPClient` interface in [src/types.d.ts](src/types.d.ts).

For an example, see the [MockPSP](src/psps/mock/index.ts) implementation.
