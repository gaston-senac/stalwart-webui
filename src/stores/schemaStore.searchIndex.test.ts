/*
 * SPDX-FileCopyrightText: 2020 Stalwart Labs LLC <hello@stalw.art>
 *
 * SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-SEL
 */

import { beforeEach, describe, expect, it } from 'vitest';
import type { Schema } from '@/types/schema';
import { OVERVIEW_VIEW_NAME } from '@/features/overview/constants';
import { ONBOARDING_VIEW_NAME } from '@/features/onboarding/checklist';
import { useSchemaStore } from './schemaStore';

function minimalSchema(): Schema {
  return {
    objects: {},
    schemas: {},
    fields: {},
    forms: {},
    lists: {},
    enums: {},
    dashboards: [],
    layouts: [
      {
        name: 'Management',
        icon: 'home',
        items: [{ link: { name: 'Domains', icon: 'globe', viewName: 'x:Domain' } }],
      },
    ],
  };
}

describe('schemaStore search index fork pages', () => {
  beforeEach(() => {
    useSchemaStore.setState({
      schema: null,
      isLoaded: false,
      viewToSection: {},
      searchIndex: [],
    });
  });

  it('indexes Overview/Onboarding with keywords and Appearance/Changelog', () => {
    useSchemaStore.getState().setSchema(minimalSchema());
    const index = useSchemaStore.getState().searchIndex;

    const overview = index.find((e) => e.viewName === OVERVIEW_VIEW_NAME);
    expect(overview?.keywords).toEqual(expect.arrayContaining(['queue', 'dkim']));

    const onboarding = index.find((e) => e.viewName === ONBOARDING_VIEW_NAME);
    expect(onboarding?.keywords).toEqual(expect.arrayContaining(['spf', 'dmarc']));

    expect(index.some((e) => e.viewName === 'Appearance' && e.keywords?.includes('theme'))).toBe(true);
    expect(index.some((e) => e.viewName === 'Changelog')).toBe(true);
  });
});
