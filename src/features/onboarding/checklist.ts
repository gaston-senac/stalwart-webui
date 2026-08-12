/*
 * SPDX-FileCopyrightText: 2020 Stalwart Labs LLC <hello@stalw.art>
 *
 * SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-SEL
 */

import { jmapQueryAllAndGet, getAccountId } from '@/services/jmap/client';

export const ONBOARDING_VIEW_NAME = 'CustomComponent/Onboarding';

export type CheckStatus = 'loading' | 'done' | 'pending' | 'unknown';

export interface ChecklistItemDef {
  id: string;
  permissionPrefix: string;
  titleKey: [string, string];
  descriptionKey: [string, string];
  actionLabelKey: [string, string];
  actionHref: string;
  check: () => Promise<boolean>;
}

async function hasEnabledDomain(): Promise<boolean> {
  const accountId = getAccountId('x:Domain');
  const { list } = await jmapQueryAllAndGet('x:Domain', accountId, {}, ['isEnabled']);
  return list.some((d) => d.isEnabled === true);
}

async function hasDkimSignature(): Promise<boolean> {
  const accountId = getAccountId('x:DkimSignature');
  const { ids } = await jmapQueryAllAndGet('x:DkimSignature', accountId, {}, []);
  return ids.length > 0;
}

async function hasValidCertificate(): Promise<boolean> {
  const accountId = getAccountId('x:Certificate');
  const { list } = await jmapQueryAllAndGet('x:Certificate', accountId, {}, ['notValidAfter']);
  const now = Date.now();
  return list.some((c) => {
    const notValidAfter = c.notValidAfter;
    if (typeof notValidAfter !== 'string') return false;
    const expiry = Date.parse(notValidAfter);
    return Number.isFinite(expiry) && expiry > now;
  });
}

async function hasAdminAccount(): Promise<boolean> {
  const accountId = getAccountId('x:Account');
  const { list } = await jmapQueryAllAndGet('x:Account', accountId, { filter: { '@type': 'User' } }, ['roles']);
  return list.some((a) => {
    const roles = a.roles as Record<string, unknown> | undefined;
    return roles?.['@type'] === 'Admin';
  });
}

// SCHEMA-DEVIATION: onboarding-checklist-nav-entry (see SCHEMA_DEVIATIONS.md)
// Each item checks a real, already-editable property (domain enabled state,
// DKIM signature presence, certificate expiry, an account with the Admin
// role) — nothing here is fabricated data, only the checklist framing itself
// is new.
export const ONBOARDING_ITEMS: ChecklistItemDef[] = [
  {
    id: 'domain',
    permissionPrefix: 'sysDomain',
    titleKey: ['onboarding.domain.title', 'Configure a domain'],
    descriptionKey: [
      'onboarding.domain.description',
      'At least one domain must be added and enabled before this server can handle mail for it.',
    ],
    actionLabelKey: ['onboarding.domain.action', 'Go to Domains'],
    actionHref: '/Management/x:Domain',
    check: hasEnabledDomain,
  },
  {
    id: 'dkim',
    permissionPrefix: 'sysDkimSignature',
    titleKey: ['onboarding.dkim.title', 'Set up DKIM signing'],
    descriptionKey: [
      'onboarding.dkim.description',
      'A DKIM signature lets receiving servers verify mail actually came from your domain.',
    ],
    actionLabelKey: ['onboarding.dkim.action', 'Go to DKIM Signatures'],
    actionHref: '/Management/x:DkimSignature',
    check: hasDkimSignature,
  },
  {
    id: 'certificate',
    permissionPrefix: 'sysCertificate',
    titleKey: ['onboarding.certificate.title', 'Install a valid TLS certificate'],
    descriptionKey: [
      'onboarding.certificate.description',
      'Required for encrypted SMTP/IMAP/HTTPS connections. Checked for at least one certificate that has not expired.',
    ],
    actionLabelKey: ['onboarding.certificate.action', 'Go to TLS Certificates'],
    actionHref: '/Settings/x:Certificate',
    check: hasValidCertificate,
  },
  {
    id: 'admin',
    permissionPrefix: 'sysAccount',
    titleKey: ['onboarding.admin.title', 'Create an administrator account'],
    descriptionKey: [
      'onboarding.admin.description',
      'A named admin account, separate from the break-glass recovery admin, should be used for day-to-day management.',
    ],
    actionLabelKey: ['onboarding.admin.action', 'Go to Accounts'],
    actionHref: '/Management/x:Account/User',
    check: hasAdminAccount,
  },
];

/**
 * Returns true when every checklist item the user can query is already done
 * (or when they cannot query any of them — the page is then useless).
 */
export async function isOnboardingComplete(
  canQuery: (permissionPrefix: string) => boolean,
): Promise<boolean> {
  const checkable = ONBOARDING_ITEMS.filter((item) => canQuery(item.permissionPrefix));
  if (checkable.length === 0) return true;

  const results = await Promise.all(
    checkable.map(async (item) => {
      try {
        return await item.check();
      } catch {
        return false;
      }
    }),
  );
  return results.every(Boolean);
}
