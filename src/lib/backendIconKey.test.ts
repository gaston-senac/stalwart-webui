/*
 * SPDX-FileCopyrightText: 2020 Stalwart Labs LLC <hello@stalw.art>
 *
 * SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-SEL
 */

import { describe, expect, it } from 'vitest';
import { normalizeBackendKey } from './backendIconKey';

describe('normalizeBackendKey', () => {
  it('strips non-alphanumerics and lowercases', () => {
    expect(normalizeBackendKey('PostgreSql')).toBe('postgresql');
    expect(normalizeBackendKey('S3')).toBe('s3');
    expect(normalizeBackendKey('FileSystem')).toBe('filesystem');
    expect(normalizeBackendKey('Redis-Cluster')).toBe('rediscluster');
  });
});
