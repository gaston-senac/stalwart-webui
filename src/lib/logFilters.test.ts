import { describe, expect, it } from 'vitest';
import type { Schema } from '@/types/schema';
import {
  filterLogNoise,
  logNoiseFilterValues,
  readLogNoiseFilters,
} from './logFilters';

const schema = {
  enums: {
    EventType: [
      { name: 'telemetry.metrics-collected', label: 'Metrics collected' },
      { name: 'telemetry.metrics-stored', label: 'Metric store' },
      { name: 'task-manager.task-scheduled', label: 'Task scheduled for future execution' },
      { name: 'task-manager.task-failed', label: 'Task failed during processing' },
      { name: 'store.blob-store-purged', label: 'Blob store purge completed' },
    ],
  },
} as unknown as Schema;

describe('log noise filters', () => {
  it('hides these event types when URL parameters are absent', () => {
    // Default state: all toggles are off, meaning the corresponding events are hidden.
    expect(readLogNoiseFilters('')).toEqual({
      showMetrics: false,
      showTasks: false,
      showBlobStorePurge: false,
    });
    expect(readLogNoiseFilters('?log.showTasks=1')).toEqual({
      showMetrics: false,
      showTasks: true,
      showBlobStorePurge: false,
    });
    expect(readLogNoiseFilters('?log.showBlobStorePurge=1')).toEqual({
      showMetrics: false,
      showTasks: false,
      showBlobStorePurge: true,
    });
  });

  it('filters groups while preserving failures and retries', () => {
    const items = [
      { id: '1', event: 'telemetry.metrics-collected' },
      { id: '2', event: 'task-manager.task-scheduled' },
      { id: '3', event: 'task-manager.task-failed' },
      { id: '4', event: 'authentication' },
      { id: '5', event: 'store.blob-store-purged' },
    ];
    // All toggles enabled: no events are hidden.
    expect(filterLogNoise(items, schema, {
      showMetrics: true,
      showTasks: true,
      showBlobStorePurge: true,
    })).toEqual(items);
    // Metrics hidden, tasks shown, purge hidden.
    expect(filterLogNoise(items, schema, {
      showMetrics: false,
      showTasks: true,
      showBlobStorePurge: false,
    })).toEqual([
      { id: '2', event: 'task-manager.task-scheduled' },
      { id: '3', event: 'task-manager.task-failed' },
      { id: '4', event: 'authentication' },
    ]);
    // Metrics hidden, tasks hidden, purge shown.
    expect(filterLogNoise(items, schema, {
      showMetrics: false,
      showTasks: false,
      showBlobStorePurge: true,
    })).toEqual([
      { id: '3', event: 'task-manager.task-failed' },
      { id: '4', event: 'authentication' },
      { id: '5', event: 'store.blob-store-purged' },
    ]);
  });

  it('computes the correct noise filter values based on enabled toggles', () => {
    const enabledAllFalse = {
      showMetrics: false,
      showTasks: false,
      showBlobStorePurge: false,
    };
    // With all filters disabled, only actionable events (failures or retries)
    // should be returned. The schema contains a single such event.
    expect(logNoiseFilterValues(schema, enabledAllFalse)).toEqual(
      new Set(['task-manager.task-failed'])
    );

    const enabledTaskTrue = {
      showMetrics: false,
      showTasks: true, // enable tasks
      showBlobStorePurge: false,
    };
    // When the task filter is enabled, the failure event should no longer be
    // considered noise, so the set should be empty.
    expect(logNoiseFilterValues(schema, enabledTaskTrue)).toEqual(new Set());
  });
});
