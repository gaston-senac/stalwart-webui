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
import { useAccountStore } from '@/stores/accountStore';
import { ONBOARDING_ITEMS, type CheckStatus } from '@/features/onboarding/checklist';

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
      ONBOARDING_ITEMS.map((item) => [
        item.id,
        hasObjectPermission(item.permissionPrefix, 'Query') ? 'loading' : 'unknown',
      ]),
    ),
  );

  useEffect(() => {
    let cancelled = false;

    for (const item of ONBOARDING_ITEMS) {
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

  const doneCount = ONBOARDING_ITEMS.filter((item) => statuses[item.id] === 'done').length;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 pt-8">
      <div className="flex items-center gap-3">
        <Rocket className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('onboarding.title', 'Getting Started')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('onboarding.subtitle', 'A quick checklist for a new Stalwart install. {{done}} of {{total}} done.', {
              done: doneCount,
              total: ONBOARDING_ITEMS.length,
            })}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {ONBOARDING_ITEMS.map((item) => {
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
