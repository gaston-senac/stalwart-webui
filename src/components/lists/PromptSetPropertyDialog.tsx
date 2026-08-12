/*
 * SPDX-FileCopyrightText: 2020 Stalwart Labs LLC <hello@stalw.art>
 *
 * SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-SEL
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useResetOnChange } from '@/hooks/useBufferedValue';
import { SIZE_UNITS, humanToBytes } from '@/lib/durationFormat';

/**
 * SCHEMA-DEVIATION: bulk-quota-change-action (see SCHEMA_DEVIATIONS.md)
 *
 * Client-only prompted mass-action shape (ideal upstream: schema
 * `promptSetProperty`). Supports `format: 'size'` today; add formats here
 * rather than one-off dialogs per property.
 */
export type PromptPropertyFormat = 'size';

export interface PromptSetPropertyConfig {
  property: string;
  format: PromptPropertyFormat;
  titleKey: [string, string];
  descriptionOneKey: [string, string];
  descriptionOtherKey: [string, string];
}

interface PromptSetPropertyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  count: number;
  config: PromptSetPropertyConfig;
  onConfirm: (value: unknown) => void;
}

export const QUOTA_PROMPT_CONFIG: PromptSetPropertyConfig = {
  property: 'quotas/maxDiskQuota',
  format: 'size',
  titleKey: ['list.changeQuotaTitle', 'Change disk quota'],
  descriptionOneKey: ['list.changeQuotaDescription_one', 'Set a new maximum disk quota for {{count}} account.'],
  descriptionOtherKey: [
    'list.changeQuotaDescription_other',
    'Set a new maximum disk quota for {{count}} accounts.',
  ],
};

export function PromptSetPropertyDialog({
  open,
  onOpenChange,
  count,
  config,
  onConfirm,
}: PromptSetPropertyDialogProps) {
  const { t } = useTranslation();
  const [unlimited, setUnlimited] = useState(false);
  const [value, setValue] = useState('1');
  const [unit, setUnit] = useState<(typeof SIZE_UNITS)[number]>('GB');

  useResetOnChange(open, () => {
    setUnlimited(false);
    setValue('1');
    setUnit('GB');
  });

  const parsedValue = parseFloat(value);
  const isValid = unlimited || (Number.isFinite(parsedValue) && parsedValue >= 0);

  const handleConfirm = () => {
    if (!isValid || config.format !== 'size') return;
    onConfirm(unlimited ? 0 : Math.round(humanToBytes(parsedValue, unit)));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t(...config.titleKey)}</DialogTitle>
          <DialogDescription>
            {count === 1
              ? t(config.descriptionOneKey[0], config.descriptionOneKey[1], { count })
              : t(config.descriptionOtherKey[0], config.descriptionOtherKey[1], { count })}
          </DialogDescription>
        </DialogHeader>
        {config.format === 'size' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="prompt-size-unlimited"
                checked={unlimited}
                onCheckedChange={(checked) => setUnlimited(checked === true)}
              />
              <Label htmlFor="prompt-size-unlimited" className="font-normal">
                {t('list.quotaNoLimit', 'No limit (unlimited)')}
              </Label>
            </div>
            {!unlimited && (
              <div className="flex gap-2">
                <Input
                  type="number"
                  min={0}
                  step="any"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="flex-1"
                  aria-label={t('list.quotaValueAria', 'Quota amount')}
                />
                <Select value={unit} onValueChange={(v) => setUnit(v as (typeof SIZE_UNITS)[number])}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SIZE_UNITS.map((u) => (
                      <SelectItem key={u} value={u}>
                        {u}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button onClick={handleConfirm} disabled={!isValid}>
            {t('common.confirm', 'Confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
