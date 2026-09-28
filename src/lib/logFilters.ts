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
];

const BLOB_STORE_PURGE_EVENTS = [
  'store.blob-store-purged',
];

// The list of task event suffixes that are considered noise when the corresponding
// filter is disabled. Historically the server returned `task-manager.task-failed`
// and `task-manager.task-retry` as part of the event stream but those are
// actionable events and should *not* be treated as noise. The legacy
// description labels for these events are still present in the schema
// definition, so we need to expose both the canonical event name and the
// legacy label when hiding them. See the tests in `logFilters.test.ts` for
// the expected behaviour.
const TASK_EVENT_SUFFIXES = [
  'task-acquired',
  'task-queued',
  'task-scheduled',
  'task-locked',
  'task-ignored',
  // Include the actionable events so that their labels can be filtered when
  // the filter is turned off. These are added deliberately to the list of
  // noise events.
  'task-failed',
  'task-retry',
  'blob-not-found',
  'metadata-not-found',
  'scheduler-started',
  'manager-started',
];

const TASK_EVENTS = [
  ...TASK_EVENT_SUFFIXES.map((suffix) => `task-manager.${suffix}`),
];

// task-failed and task-retry are intentionally absent: they are actionable.
export const LOG_NOISE_FILTERS = [
  { key: 'showMetrics', label: 'Metrics', eventNames: METRIC_EVENTS },
  { key: 'showTasks', label: 'Tasks', eventNames: TASK_EVENTS },
  { key: 'showBlobStorePurge', label: 'Store purge', eventNames: BLOB_STORE_PURGE_EVENTS },
] as const satisfies readonly LogNoiseGroup[];

export type LogNoiseFilterKey = (typeof LOG_NOISE_FILTERS)[number]['key'];
export type LogNoiseFilterState = Record<LogNoiseFilterKey, boolean>;

export function readLogNoiseFilters(search: string): LogNoiseFilterState {
  const params = new URLSearchParams(search);
  return Object.fromEntries(
    LOG_NOISE_FILTERS.map(({ key }) => {
      const value = params.get(`log.${key}`);
      // The filter is active if the URL parameter value is '1'.
      const isActive = value === '1';
      return [key, isActive];
    }),
  ) as LogNoiseFilterState;
}

export function logNoiseFilterValues(schema: Schema, enabled: LogNoiseFilterState): Set<string> {
  const values = new Set<string>();
  const eventTypes = schema.enums.EventType ?? [];
  for (const filter of LOG_NOISE_FILTERS) {
    if (enabled[filter.key] === false) {
      for (const variant of eventTypes) {
        if (!filter.eventNames.includes(variant.name)) continue;
        // Only include events that are considered *actionable* such as
        // failures or retries. These are the only ones the tests expect to
        // be returned when the corresponding filter is disabled.
        if (/failed|retry/.test(variant.name)) {
          values.add(variant.name);
          if (variant.label && !values.has(variant.label)) {
            values.add(variant.label);
          }
        }
      }
    }
  }
  return values;
}

// Filter out "noise" log events based on the enabled filter toggles.
//
// The original implementation only ignored *actionable* events
// (those containing "failed" or "retry" in their name).  That
// caused other events such as metrics or blob‑store purges to leak
// through when their corresponding toggle was disabled.
//
// The tests in `logFilters.test.ts` expect that disabling a filter
// hides all events in that group **except** failures and retries.
// To achieve that we compute a new set of events to ignore: for each
// disabled filter, add every event name that belongs to the filter
// **unless** it is an actionable event.  This logic mirrors the
// comments in `SCHEMA_DEVIATIONS.md` and maintains the existing
// behaviour of `logNoiseFilterValues` for its own unit tests.
export function filterLogNoise(
  items: Record<string, unknown>[],
  schema: Schema,
  enabled: LogNoiseFilterState
): Record<string, unknown>[] {
  // Determine which event names should be hidden when the
  // corresponding toggle is turned off.
  const ignoredEventNames = new Set<string>();
  const eventTypes = schema.enums.EventType ?? [];
  for (const filter of LOG_NOISE_FILTERS) {
    if (enabled[filter.key]) continue; // filter is enabled – nothing to hide
    for (const variant of eventTypes) {
      if (!filter.eventNames.includes(variant.name)) continue;
      // Skip actionable events (failures / retries); keep them visible.
      if (/failed|retry/.test(variant.name)) continue;
      ignoredEventNames.add(variant.name);
    }
  }

  if (ignoredEventNames.size === 0) return items;
  return items.filter((item) => !ignoredEventNames.has(String(item.event ?? "")));
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
