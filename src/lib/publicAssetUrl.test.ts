/*
 * SPDX-FileCopyrightText: 2020 Stalwart Labs LLC <hello@stalw.art>
 *
 * SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-SEL
 */

import { afterEach, describe, expect, it } from 'vitest';
import { publicAssetUrl } from './publicAssetUrl';

describe('publicAssetUrl', () => {
  const originalBase = document.baseURI;

  afterEach(() => {
    const baseEl = document.querySelector('base');
    if (baseEl) baseEl.remove();
    // Restore a root base for other tests.
    const b = document.createElement('base');
    b.href = originalBase || '/';
    document.head.appendChild(b);
  });

  it('resolves against rewritten <base href> (Stalwart /admin mount)', () => {
    let baseEl = document.querySelector('base');
    if (!baseEl) {
      baseEl = document.createElement('base');
      document.head.appendChild(baseEl);
    }
    baseEl.setAttribute('href', 'https://mail.example.com/admin/');

    const url = publicAssetUrl('/icons/backends/aws-light.svg');
    expect(url).toBe('https://mail.example.com/admin/icons/backends/aws-light.svg');
  });

  it('strips a leading slash before joining', () => {
    let baseEl = document.querySelector('base');
    if (!baseEl) {
      baseEl = document.createElement('base');
      document.head.appendChild(baseEl);
    }
    baseEl.setAttribute('href', 'https://mail.example.com/admin/');

    expect(publicAssetUrl('icons/backends/sqlite.svg')).toBe(
      'https://mail.example.com/admin/icons/backends/sqlite.svg',
    );
  });
});
