/*
 * SPDX-FileCopyrightText: 2020 Stalwart Labs LLC <hello@stalw.art>
 *
 * SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-SEL
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { deleteLogFilterPreset, listLogFilterPresets, saveLogFilterPreset } from './logFilterPresets';

describe('logFilterPresets', () => {
  beforeEach(() => {
    const values = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
      clear: () => values.clear(),
    });
  });

  it('saves, lists, replaces same name, and deletes', () => {
    saveLogFilterPreset('Errors', { level: 'error' });
    saveLogFilterPreset('Errors', { level: 'error', event: 'auth' });
    expect(listLogFilterPresets()).toHaveLength(1);
    expect(listLogFilterPresets()[0].filters).toEqual({ level: 'error', event: 'auth' });

    const second = saveLogFilterPreset('Auth', { event: 'auth' });
    expect(listLogFilterPresets()).toHaveLength(2);
    deleteLogFilterPreset(second.id);
    expect(listLogFilterPresets().map((p) => p.name)).toEqual(['Errors']);
  });

  it('persists noise visibility with a preset', () => {
    saveLogFilterPreset('Quiet', {}, { hideMetrics: false, hideTasks: true });
    expect(listLogFilterPresets()[0].noiseFilters).toEqual({
      hideMetrics: false,
      hideTasks: true,
    });
  });
});
