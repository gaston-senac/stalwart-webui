/*
 * SPDX-FileCopyrightText: 2020 Stalwart Labs LLC <hello@stalw.art>
 *
 * SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-SEL
 */

export type OverviewSectionId = 'directory' | 'mailReadiness' | 'access' | 'reports';

export interface OverviewCardDef {
  id: string;
  section: OverviewSectionId;
  /** Sidebar / list view name used for deep-links and schema resolution. */
  viewName: string;
  icon: string;
  labelKey: [string, string];
  filter?: Record<string, unknown>;
  /** Optional post-count enrichment (certificates valid/expired). */
  enrich?: 'certificateValidity';
}

export const OVERVIEW_SECTIONS: Array<{
  id: OverviewSectionId;
  titleKey: [string, string];
}> = [
  { id: 'directory', titleKey: ['overview.sections.directory', 'Directory'] },
  { id: 'mailReadiness', titleKey: ['overview.sections.mailReadiness', 'Mail readiness'] },
  { id: 'access', titleKey: ['overview.sections.access', 'Access & apps'] },
  { id: 'reports', titleKey: ['overview.sections.reports', 'Reports'] },
];

// SCHEMA-DEVIATION: community-overview-nav-entry (see SCHEMA_DEVIATIONS.md)
// Card inventory only — each count is a real JMAP query total against an
// existing object type; nothing is fabricated.
export const OVERVIEW_CARDS: OverviewCardDef[] = [
  {
    id: 'users',
    section: 'directory',
    viewName: 'x:Account/User',
    icon: 'users',
    labelKey: ['overview.cards.users', 'Users'],
    filter: { '@type': 'User' },
  },
  {
    id: 'groups',
    section: 'directory',
    viewName: 'x:Account/Group',
    icon: 'users-round',
    labelKey: ['overview.cards.groups', 'Groups'],
    filter: { '@type': 'Group' },
  },
  {
    id: 'domains',
    section: 'directory',
    viewName: 'x:Domain',
    icon: 'globe',
    labelKey: ['overview.cards.domains', 'Domains'],
  },
  {
    id: 'roles',
    section: 'directory',
    viewName: 'x:Role',
    icon: 'shield',
    labelKey: ['overview.cards.roles', 'Roles'],
  },
  {
    id: 'mailingLists',
    section: 'directory',
    viewName: 'x:MailingList',
    icon: 'mails',
    labelKey: ['overview.cards.mailingLists', 'Mailing lists'],
  },
  {
    id: 'dkim',
    section: 'mailReadiness',
    viewName: 'x:DkimSignature',
    icon: 'key-round',
    labelKey: ['overview.cards.dkim', 'DKIM signatures'],
  },
  {
    id: 'certificates',
    section: 'mailReadiness',
    viewName: 'x:Certificate',
    icon: 'lock',
    labelKey: ['overview.cards.certificates', 'TLS certificates'],
    enrich: 'certificateValidity',
  },
  {
    id: 'queuedMessages',
    section: 'mailReadiness',
    viewName: 'x:QueuedMessage',
    icon: 'mail',
    labelKey: ['overview.cards.queuedMessages', 'Queued messages'],
  },
  {
    id: 'apiKeys',
    section: 'access',
    viewName: 'x:ApiKey',
    icon: 'key',
    labelKey: ['overview.cards.apiKeys', 'API keys'],
  },
  {
    id: 'oauthClients',
    section: 'access',
    viewName: 'x:OAuthClient',
    icon: 'key-square',
    labelKey: ['overview.cards.oauthClients', 'OAuth clients'],
  },
  {
    id: 'applications',
    section: 'access',
    viewName: 'x:Application',
    icon: 'app-window',
    labelKey: ['overview.cards.applications', 'Web applications'],
  },
  {
    id: 'dmarcExternal',
    section: 'reports',
    viewName: 'x:DmarcExternalReport',
    icon: 'shield-check',
    labelKey: ['overview.cards.dmarcExternal', 'DMARC (inbound)'],
  },
  {
    id: 'dmarcInternal',
    section: 'reports',
    viewName: 'x:DmarcInternalReport',
    icon: 'shield-check',
    labelKey: ['overview.cards.dmarcInternal', 'DMARC (outbound)'],
  },
  {
    id: 'tlsExternal',
    section: 'reports',
    viewName: 'x:TlsExternalReport',
    icon: 'file-lock',
    labelKey: ['overview.cards.tlsExternal', 'TLS reports (inbound)'],
  },
  {
    id: 'tlsInternal',
    section: 'reports',
    viewName: 'x:TlsInternalReport',
    icon: 'file-lock',
    labelKey: ['overview.cards.tlsInternal', 'TLS reports (outbound)'],
  },
  {
    id: 'arf',
    section: 'reports',
    viewName: 'x:ArfExternalReport',
    icon: 'triangle-alert',
    labelKey: ['overview.cards.arf', 'ARF / abuse reports'],
  },
];
