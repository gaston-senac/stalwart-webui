/*
 * SPDX-FileCopyrightText: 2020 Stalwart Labs LLC <hello@stalw.art>
 *
 * SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-SEL
 */

import { describe, expect, it } from 'vitest';
import { effectiveNumberFormat, isByteSizePropertyName } from './byteSizeFormat';

describe('isByteSizePropertyName', () => {
  it('recognizes Stalwart byte property names', () => {
    expect(isByteSizePropertyName('size')).toBe(true);
    expect(isByteSizePropertyName('maxSize')).toBe(true);
    expect(isByteSizePropertyName('usedDiskQuota')).toBe(true);
    expect(isByteSizePropertyName('maxDiskQuota')).toBe(true);
  });

  it('rejects unrelated names', () => {
    expect(isByteSizePropertyName('position')).toBe(false);
    expect(isByteSizePropertyName('total')).toBe(false);
    expect(isByteSizePropertyName('aliases')).toBe(false);
  });
});

describe('effectiveNumberFormat', () => {
  it('promotes queued-message style unsignedInteger size to size', () => {
    expect(effectiveNumberFormat('size', 'unsignedInteger')).toBe('size');
  });

  it('keeps explicit size and duration', () => {
    expect(effectiveNumberFormat('size', 'size')).toBe('size');
    expect(effectiveNumberFormat('ttl', 'duration')).toBe('duration');
  });

  it('does not promote unrelated integer columns', () => {
    expect(effectiveNumberFormat('position', 'unsignedInteger')).toBe('unsignedInteger');
  });

  it('does not override float', () => {
    expect(effectiveNumberFormat('size', 'float')).toBe('float');
  });
});
