/*
 * SPDX-FileCopyrightText: 2020 Stalwart Labs LLC <hello@stalw.art>
 *
 * SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-SEL
 */

import { getAccountId, jmapQueryAllAndGet, jmapRequest } from '@/services/jmap/client';
import { resolveObject } from '@/lib/schemaResolver';
import type { Schema } from '@/types/schema';
import type { JmapMethodCall, JmapQueryResponse } from '@/types/jmap';
import type { OverviewCardDef } from '@/features/overview/cards';

/** Stay under typical Stalwart maxCallsInRequest (often 16). */
const QUERY_BATCH_SIZE = 12;

export type CardTotalStatus = 'ok' | 'unavailable';

export interface CardTotal {
  status: CardTotalStatus;
  total?: number;
  /** Present when enrich === 'certificateValidity' and fetch succeeded. */
  valid?: number;
  expired?: number;
}

export interface ResolvedOverviewCard extends OverviewCardDef {
  objectType: string;
  permissionPrefix: string;
  href: string;
}

/** Resolve schema-backed cards the current admin can query. */
export function resolveQueryableCards(
  schema: Schema,
  cards: OverviewCardDef[],
  viewToSection: Record<string, string>,
  canQuery: (permissionPrefix: string) => boolean,
): ResolvedOverviewCard[] {
  const out: ResolvedOverviewCard[] = [];

  for (const card of cards) {
    const obj = resolveObject(schema, card.viewName);
    if (!obj) continue;
    if (!canQuery(obj.permissionPrefix)) continue;

    const section = viewToSection[card.viewName] ?? 'Management';
    out.push({
      ...card,
      objectType: obj.objectName,
      permissionPrefix: obj.permissionPrefix,
      href: `/${section}/${card.viewName}`,
    });
  }

  return out;
}

export async function fetchCardTotals(
  cards: ResolvedOverviewCard[],
  signal?: AbortSignal,
): Promise<Record<string, CardTotal>> {
  const totals: Record<string, CardTotal> = {};
  if (cards.length === 0) return totals;

  for (let offset = 0; offset < cards.length; offset += QUERY_BATCH_SIZE) {
    if (signal?.aborted) break;
    const batch = cards.slice(offset, offset + QUERY_BATCH_SIZE);
    const methodCalls: JmapMethodCall[] = batch.map((card, index) => {
      const accountId = getAccountId(card.objectType);
      const args: Record<string, unknown> = {
        accountId,
        limit: 1,
        position: 0,
        calculateTotal: true,
      };
      if (card.filter) args.filter = card.filter;
      return [`${card.objectType}/query`, args, String(index)];
    });

    let responses;
    try {
      responses = await jmapRequest(methodCalls, signal);
    } catch {
      for (const card of batch) {
        totals[card.id] = { status: 'unavailable' };
      }
      continue;
    }

    const byCallId = new Map(responses.map((r) => [r[2], r]));
    for (let i = 0; i < batch.length; i++) {
      const card = batch[i];
      const response = byCallId.get(String(i));
      if (!response || response[0] === 'error') {
        totals[card.id] = { status: 'unavailable' };
        continue;
      }
      const body = response[1] as unknown as JmapQueryResponse;
      const total = typeof body.total === 'number' ? body.total : body.ids?.length;
      if (typeof total !== 'number') {
        totals[card.id] = { status: 'unavailable' };
        continue;
      }
      totals[card.id] = { status: 'ok', total };
    }
  }

  const certCard = cards.find((c) => c.enrich === 'certificateValidity');
  if (certCard && totals[certCard.id]?.status === 'ok' && !signal?.aborted) {
    try {
      const accountId = getAccountId(certCard.objectType);
      const { list } = await jmapQueryAllAndGet(certCard.objectType, accountId, {}, ['notValidAfter'], signal);
      const now = Date.now();
      let valid = 0;
      let expired = 0;
      for (const item of list) {
        const notValidAfter = item.notValidAfter;
        if (typeof notValidAfter !== 'string') {
          expired += 1;
          continue;
        }
        const expiry = Date.parse(notValidAfter);
        if (Number.isFinite(expiry) && expiry > now) valid += 1;
        else expired += 1;
      }
      totals[certCard.id] = { ...totals[certCard.id], valid, expired };
    } catch {
      // Keep the main total; enrichment is best-effort.
    }
  }

  return totals;
}
