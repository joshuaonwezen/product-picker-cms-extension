import {describe, expect, it} from 'vitest';

import {toOptions} from './catalog';

// Shape of optimizely-nextjs-demo GET /api/catalog/products (2026-11-06).
const CATALOG = {
  updatedAt: '2026-11-06',
  products: [
    {
      id: 'fixed-saver-1y',
      name: '1-Year Fixed Saver',
      category: 'savings',
      rate: {value: 5.1, label: 'AER', basis: 'fixed', note: 'Rate fixed for 12 months'},
    },
    {id: 'balance-transfer-card', name: 'Balance Transfer Credit Card', category: 'credit-card', rate: {value: 0, label: 'APR', basis: 'fixed'}},
    {id: 'no-rate', name: 'Advice service', category: 'something-new'},
  ],
};

describe('toOptions', () => {
  it('labels each product with its rate and groups it by category', () => {
    expect(toOptions(CATALOG)).toEqual([
      {value: 'fixed-saver-1y', label: '1-Year Fixed Saver: 5.10% AER', group: 'Savings', detail: '5.10% AER, fixed. Rate fixed for 12 months'},
      {value: 'balance-transfer-card', label: 'Balance Transfer Credit Card: 0.00% APR', group: 'Credit cards', detail: '0.00% APR, fixed'},
      {value: 'no-rate', label: 'Advice service', group: 'Other', detail: ''},
    ]);
  });

  it('skips entries without an id or name', () => {
    expect(toOptions({products: [{id: 'x'}, {name: 'y'}]})).toEqual([]);
    expect(toOptions(null)).toEqual([]);
  });
});
