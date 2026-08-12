/*
 * SPDX-FileCopyrightText: 2020 Stalwart Labs LLC <hello@stalw.art>
 *
 * SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-SEL
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CircleCheck, CircleAlert, HelpCircle, Loader2, Rocket } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { jmapQueryAllAndGet, getAccountId } from '@/services/jmap/client';
import { useAccountStore } from '@/stores/accountStore';

type CheckStatus = 'loading' | 'done' | 'pending' | 'unknown';

interface ChecklistItemDef {
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
const ITEMS: ChecklistItemDef[] = [
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

function StatusIcon({ status }: { status: CheckStatus }) {
  switch (status) {
    case 'loading':
      return <Loader2 className="h-5 w-5 shrink-0 animate-spin text-muted-foreground" />;
    case 'done':
      return <CircleCheck className="h-5 w-5 shrink-0 text-green-600" />;
    case 'pending':
      return <CircleAlert className="h-5 w-5 shrink-0 text-amber-500" />;
    case 'unknown':
      return <HelpCircle className="h-5 w-5 shrink-0 text-muted-foreground" />;
  }
}

export function OnboardingChecklistPage() {
  const { t } = useTranslation();
  const hasObjectPermission = useAccountStore((s) => s.hasObjectPermission);
  // Items without permission start (and stay) 'unknown' — computed here rather
  // than in the effect below so that branch never calls setState synchronously
  // from within the effect body.
  const [statuses, setStatuses] = useState<Record<string, CheckStatus>>(() =>
    Object.fromEntries(
      ITEMS.map((item) => [item.id, hasObjectPermission(item.permissionPrefix, 'Query') ? 'loading' : 'unknown']),
    ),
  );

  useEffect(() => {
    let cancelled = false;

    for (const item of ITEMS) {
      if (!hasObjectPermission(item.permissionPrefix, 'Query')) continue;
      item
        .check()
        .then((done) => {
          if (!cancelled) setStatuses((prev) => ({ ...prev, [item.id]: done ? 'done' : 'pending' }));
        })
        .catch(() => {
          if (!cancelled) setStatuses((prev) => ({ ...prev, [item.id]: 'unknown' }));
        });
    }

    return () => {
      cancelled = true;
    };
  }, [hasObjectPermission]);

  const doneCount = ITEMS.filter((item) => statuses[item.id] === 'done').length;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 pt-8">
      <div className="flex items-center gap-3">
        <Rocket className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('onboarding.title', 'Getting Started')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('onboarding.subtitle', 'A quick checklist for a new Stalwart install. {{done}} of {{total}} done.', {
              done: doneCount,
              total: ITEMS.length,
            })}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {ITEMS.map((item) => {
          const status = statuses[item.id] ?? 'loading';
          return (
            <Card key={item.id}>
              <CardContent className="flex items-start gap-3 pt-6">
                <StatusIcon status={status} />
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="font-medium leading-none">{t(...item.titleKey)}</p>
                  <p className="text-sm text-muted-foreground">{t(...item.descriptionKey)}</p>
                  {status === 'unknown' && (
                    <p className="text-xs text-muted-foreground italic">
                      {t('onboarding.unknown', "Couldn't be checked — you may not have permission to view this.")}
                    </p>
                  )}
                </div>
                <Button variant="outline" size="sm" asChild className="shrink-0">
                  <Link to={item.actionHref}>{t(...item.actionLabelKey)}</Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('onboarding.moreTitle', 'Want to go further?')}</CardTitle>
          <CardDescription>
            {t(
              'onboarding.moreDescription',
              'The Dashboard (Enterprise) and Delivery tests page cover live server metrics and outbound delivery diagnostics.',
            )}
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
