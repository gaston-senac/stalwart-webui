/*
 * SPDX-FileCopyrightText: 2020 Stalwart Labs LLC <hello@stalw.art>
 *
 * SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-SEL
 */

import type { Schema } from '@/types/schema';
import type { ClientOnlyFilterEnum } from './schemaDeviationTypes';

type LogNoiseGroup = {
  key: string;
  label: string;
  eventNames: string[];
};

const METRIC_EVENTS = [
  'telemetry.metrics-collected',
  'telemetry.metrics-stored',
  'telemetry.metrics-pushed',
  // Names used by older event schemas.
  'metricsCollected',
  'metricsStored',
  'metricsPushed',
];

const TASK_EVENT_SUFFIXES = [
  'task-acquired',
  'task-queued',
  'task-scheduled',
  'task-locked',
  'task-ignored',
  'blob-not-found',
  'metadata-not-found',
  'scheduler-started',
  'manager-started',
];

const TASK_EVENTS = [
  ...TASK_EVENT_SUFFIXES.map((suffix) => `task-manager.${suffix}`),
  // Stalwart versions before v0.16 used task-queue.*.
  ...TASK_EVENT_SUFFIXES.map((suffix) => `task-queue.${suffix}`),
];

// task-failed and task-retry are intentionally absent: they are actionable.
export const LOG_NOISE_FILTERS = [
  { key: 'hideMetrics', label: 'Metrics', eventNames: METRIC_EVENTS },
  { key: 'hideTasks', label: 'Tasks', eventNames: TASK_EVENTS },
] as const satisfies readonly LogNoiseGroup[];

export type LogNoiseFilterKey = (typeof LOG_NOISE_FILTERS)[number]['key'];
export type LogNoiseFilterState = Record<LogNoiseFilterKey, boolean>;

export function readLogNoiseFilters(search: string): LogNoiseFilterState {
  const params = new URLSearchParams(search);
  return Object.fromEntries(
    LOG_NOISE_FILTERS.map(({ key }) => {
      const legacyKey = key === 'hideMetrics' ? 'hideMetricsCollected' : 'hideTaskScheduled';
      const value = params.get(`log.${key}`) ?? params.get(`log.${legacyKey}`);
      return [key, value !== '0'];
    }),
  ) as LogNoiseFilterState;
}

export function logNoiseFilterValues(schema: Schema, enabled: LogNoiseFilterState): Set<string> {
  const values = new Set<string>();
  const eventTypes = schema.enums.EventType ?? [];
  for (const filter of LOG_NOISE_FILTERS) {
    if (!enabled[filter.key]) continue;

    // Event names are the identity. Only hide names the connected schema
    // advertises, so new/unknown events remain visible and old task-queue
    // servers do not receive assumptions about task-manager.* names.
    for (const variant of eventTypes) {
      if (filter.eventNames.includes(variant.name)) {
        values.add(variant.name);
        // Legacy rows may contain the rendered label rather than the enum
        // name; accept that representation only as a fallback.
        values.add(variant.label);
      }
    }
  }
  return values;
}

export function filterLogNoise(
  items: Record<string, unknown>[],
  schema: Schema,
  enabled: LogNoiseFilterState,
): Record<string, unknown>[] {
  const ignoredValues = logNoiseFilterValues(schema, enabled);
  if (ignoredValues.size === 0) return items;
  return items.filter((item) => !ignoredValues.has(String(item.event ?? '')));
}

/**
 * SCHEMA-DEVIATION: log-client-filters (see SCHEMA_DEVIATIONS.md)
 *
 * The Stalwart JMAP backend rejects `level`/`event` as filter conditions on
 * `x:Log/query` (`unsupportedFilter`), even though both properties are
 * already returned per row. Until the backend adds real support, these two
 * filters are appended client-side and applied entirely in the browser
 * (see the `clientOnly` flag consumed by DynamicList) instead of being sent
 * to the server.
 */
export function withClientLogFilters(schema: Schema): Schema {
  const logList = schema.lists['x:Log'];
  if (!logList || !schema.enums['TracingLevel'] || !schema.enums['EventType']) return schema;

  const levelFilter: ClientOnlyFilterEnum = {
    type: 'enum',
    field: 'level',
    enumName: 'TracingLevel',
    label: 'Level',
    clientOnly: true,
  };
  const eventFilter: ClientOnlyFilterEnum = {
    type: 'enum',
    field: 'event',
    enumName: 'EventType',
    label: 'Event',
    clientOnly: true,
  };

  return {
    ...schema,
    lists: {
      ...schema.lists,
      'x:Log': {
        ...logList,
        filters: [...(logList.filters ?? []), levelFilter, eventFilter],
      },
    },
  };
}
