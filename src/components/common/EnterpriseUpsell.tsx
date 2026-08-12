/*
 * SPDX-FileCopyrightText: 2020 Stalwart Labs LLC <hello@stalw.art>
 *
 * SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-SEL
 */

import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface EnterpriseUpsellProps {
  open: boolean;
  onClose: () => void;
  /** Community alternative when Dashboard / live features are locked. */
  overviewHref?: string | null;
}

export function EnterpriseUpsell({ open, onClose, overviewHref }: EnterpriseUpsellProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('enterprise.trialTitle')}</DialogTitle>
          <DialogDescription>{t('enterprise.trialDescription')}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
          {overviewHref && (
            <Button variant="secondary" asChild onClick={onClose}>
              <Link to={overviewHref}>{t('enterprise.openOverview', 'Open Overview')}</Link>
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            {t('common.close')}
          </Button>
          <Button asChild>
            <a href="https://license.stalw.art/trial" target="_blank" rel="noopener noreferrer">
              {t('enterprise.trialButton')}
            </a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
