/*
 * SPDX-FileCopyrightText: 2020 Stalwart Labs LLC <hello@stalw.art>
 *
 * SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-SEL
 */

import {
  PromptSetPropertyDialog,
  QUOTA_PROMPT_CONFIG,
} from '@/components/lists/PromptSetPropertyDialog';

interface ChangeQuotaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  count: number;
  onConfirm: (bytes: number) => void;
}

/**
 * SCHEMA-DEVIATION: bulk-quota-change-action (see SCHEMA_DEVIATIONS.md)
 *
 * Thin wrapper around the generic prompted mass-action dialog for disk quota.
 */
export function ChangeQuotaDialog({ open, onOpenChange, count, onConfirm }: ChangeQuotaDialogProps) {
  return (
    <PromptSetPropertyDialog
      open={open}
      onOpenChange={onOpenChange}
      count={count}
      config={QUOTA_PROMPT_CONFIG}
      onConfirm={(value) => onConfirm(typeof value === 'number' ? value : 0)}
    />
  );
}
