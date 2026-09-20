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
  it('enables all filters when URL parameters are absent', () => {
    expect(readLogNoiseFilters('')).toEqual({
      hideMetrics: true,
      hideTasks: true,
      hideBlobStorePurge: true,
    });
    expect(readLogNoiseFilters('?log.hideMetrics=0&log.hideTasks=1')).toEqual({
      hideMetrics: false,
      hideTasks: true,
      hideBlobStorePurge: true,
    });
    expect(readLogNoiseFilters('?log.hideMetricsCollected=0&log.hideTaskScheduled=0')).toEqual({
      hideMetrics: false,
      hideTasks: false,
      hideBlobStorePurge: true,
    });
    expect(readLogNoiseFilters('?log.hideBlobStorePurge=0')).toEqual({
      hideMetrics: true,
      hideTasks: true,
      hideBlobStorePurge: false,
    });
  });

  it('resolves advertised canonical names and legacy labels', () => {
    expect(logNoiseFilterValues(schema, {
      hideMetrics: true,
      hideTasks: false,
      hideBlobStorePurge: false,
    })).toEqual(new Set([
      'telemetry.metrics-collected',
      'Metrics collected',
      'telemetry.metrics-stored',
      'Metric store',
    ]));
  });

  it('filters groups while preserving failures and retries', () => {
    const items = [
      { id: '1', event: 'telemetry.metrics-collected' },
      { id: '2', event: 'Task scheduled for future execution' },
      { id: '3', event: 'task-manager.task-failed' },
      { id: '4', event: 'authentication' },
      { id: '5', event: 'store.blob-store-purged' },
    ];
    expect(filterLogNoise(items, schema, {
      hideMetrics: true,
      hideTasks: true,
      hideBlobStorePurge: true,
    })).toEqual([
      { id: '3', event: 'task-manager.task-failed' },
      { id: '4', event: 'authentication' },
    ]);
    expect(filterLogNoise(items, schema, {
      hideMetrics: false,
      hideTasks: true,
      hideBlobStorePurge: false,
    })).toEqual([
      { id: '1', event: 'telemetry.metrics-collected' },
      { id: '3', event: 'task-manager.task-failed' },
      { id: '4', event: 'authentication' },
      { id: '5', event: 'store.blob-store-purged' },
    ]);
    expect(filterLogNoise(items, schema, {
      hideMetrics: false,
      hideTasks: false,
      hideBlobStorePurge: true,
    })).toEqual([
      { id: '1', event: 'telemetry.metrics-collected' },
      { id: '2', event: 'Task scheduled for future execution' },
      { id: '3', event: 'task-manager.task-failed' },
      { id: '4', event: 'authentication' },
    ]);
  });

  it('supports task-queue names only when advertised', () => {
    const oldSchema = {
      enums: { EventType: [{ name: 'task-queue.task-scheduled', label: 'Task scheduled' }] },
    } as unknown as Schema;
    expect(filterLogNoise([{ event: 'task-queue.task-scheduled' }], oldSchema, {
      hideMetrics: false,
      hideTasks: true,
      hideBlobStorePurge: false,
    })).toEqual([]);
  });
});
