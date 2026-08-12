/*
 * SPDX-FileCopyrightText: 2020 Stalwart Labs LLC <hello@stalw.art>
 *
 * SPDX-License-Identifier: AGPL-3.0-only OR LicenseRef-SEL
 */

import React from 'react';
import {
  Boxes,
  CircleOff,
  Cloud,
  Database,
  FileText,
  Folder,
  Globe,
  HardDrive,
  KeyRound,
  Network,
  Radio,
  Search,
  Server,
  Settings2,
  type LucideIcon,
} from 'lucide-react';

import { normalizeBackendKey } from '@/lib/backendIconKey';
import { publicAssetUrl } from '@/lib/publicAssetUrl';

/** Brand files under `public/icons/backends/` (filename only — resolved via publicAssetUrl). */
const BACKEND_ICON_FILES: Record<string, string> = {
  // Storage / database backends
  foundationdb: 'foundationdb.svg',
  mariadb: 'mysql.svg',
  mysql: 'mysql.svg',
  postgres: 'postgresql.svg',
  postgresql: 'postgresql.svg',
  quad9: 'quad9.svg',
  redis: 'redis.svg',
  rediscluster: 'redis.svg',
  redissentinel: 'redis.svg',
  redisvalkey: 'redis.svg',
  rocksdb: 'rocksdb.svg',
  sqlite: 'sqlite.svg',
  valkey: 'valkey.svg',
  // S3-compatible stores share the AWS mark (MinIO, Wasabi, DO Spaces, …)
  s3: 'aws-light.svg',

  // Cloud / DNS providers with official icons
  alibaba: 'alibaba.svg',
  alibabacloud: 'alibaba.svg',
  alidns: 'alibaba.svg',
  amazonwebservices: 'aws-light.svg',
  aws: 'aws-light.svg',
  lightsail: 'aws-light.svg',
  route53: 'aws-light.svg',
  azure: 'azure.ico',
  azuredns: 'azure.ico',
  baidu: 'baiducloud-color.svg',
  baiducloud: 'baiducloud-color.svg',
  bunny: 'bunny.svg',
  bunnynet: 'bunny.svg',
  cloudflare: 'cloudflare.svg',
  cpanel: 'cpanel.svg',
  digitalocean: 'digital-ocean.svg',
  dnsimple: 'dnsimple.svg',
  dreamhost: 'dream-host.svg',
  duckdns: 'duckdns.svg',
  dynu: 'dynu.png',
  gandi: 'gandi.svg',
  gandiv5: 'gandi.svg',
  godaddy: 'godaddy.svg',
  google: 'google.svg',
  googleclouddns: 'google-cloud.svg',
  googlecloud: 'google-cloud.svg',
  hetzner: 'hetzner.svg',
  hostinger: 'hostinger.svg',
  ibm: 'ibm.svg',
  ibmcloud: 'ibm.svg',
  ionos: 'ionos.svg',
  linode: 'linode.svg',
  namecheap: 'namecheap.svg',
  netlify: 'netlify.svg',
  oracle: 'oracle-cloud.svg',
  oraclecloud: 'oracle-cloud.svg',
  ovh: 'ovh.svg',
  plesk: 'plesk.svg',
  porkbun: 'porkbun.png',
  scaleway: 'scaleway.svg',
  tencent: 'tencentcloud-color.svg',
  tencentcloud: 'tencentcloud-color.svg',
  vercel: 'vercel.svg',
  vultr: 'vultr.svg',
  yandex: 'yandex.svg',
  yandexcloud: 'yandex.svg',
};

/** Lucide stand-ins when no brand file exists (stores, directory, search, DNS). */
const LUCIDE_FALLBACKS: Record<string, LucideIcon> = {
  // Blob / data / memory / lookup stores
  filesystem: HardDrive,
  default: Database,
  sharded: Boxes,
  elasticsearch: Search,
  meilisearch: Search,
  ldap: Network,
  sql: Database,
  oidc: KeyRound,
  internal: Server,
  manual: Settings2,
  automatic: Settings2,
  system: Server,
  custom: Settings2,
  disabled: CircleOff,
  disable: CircleOff,
  folder: Folder,
  file: Folder,
  http: Cloud,
  kafka: Radio,
  nats: Radio,
  journal: FileText,
  log: FileText,
  grpc: Network,
  // DNS / ACME providers without a local brand asset
  desec: Globe,
  spaceship: Globe,
  arvancloud: Cloud,
  autodns: Globe,
  bluecatv2: Globe,
  cloudns: Globe,
  constellix: Globe,
  ddnss: Globe,
  dnsmadeeasy: Globe,
  domeneshop: Globe,
  easydns: Globe,
  edgedns: Cloud,
  exoscale: Cloud,
  freemyip: Globe,
  gcore: Cloud,
  glesys: Cloud,
  hostingde: Globe,
  huaweicloud: Cloud,
  hurricane: Globe,
  infoblox: Globe,
  infomaniak: Globe,
  inwx: Globe,
  ipv64: Globe,
  joker: Globe,
  luadns: Globe,
  mythicbeasts: Globe,
  namedotcom: Globe,
  namesilo: Globe,
  netcup: Globe,
  nifcloud: Cloud,
  ns1: Globe,
  safedns: Globe,
  transip: Globe,
  ultradns: Globe,
  volcengine: Cloud,
  websupport: Globe,
  tsig: KeyRound,
  deprecated1: CircleOff,
};

interface BackendIconProps {
  backend: string | null | undefined;
  className?: string;
  fallback?: React.ReactNode;
}

export function BackendIcon({ backend, className, fallback = null }: BackendIconProps): React.ReactElement | null {
  if (!backend) return null;

  const key = normalizeBackendKey(backend);
  const file = BACKEND_ICON_FILES[key] ?? BACKEND_ICON_FILES[backend.toLowerCase()];
  if (file) {
    return (
      <img
        src={publicAssetUrl(`icons/backends/${file}`)}
        alt={`${backend} icon`}
        className={className ?? 'h-4 w-4 object-contain'}
        loading="lazy"
      />
    );
  }

  const Lucide = LUCIDE_FALLBACKS[key];
  if (Lucide) {
    return <Lucide className={className ?? 'h-4 w-4 shrink-0 text-muted-foreground'} aria-hidden />;
  }

  return fallback as React.ReactElement | null;
}

interface BackendVariantIconProps {
  variant: { name: string; label: string };
  className?: string;
}

export function BackendVariantIcon({ variant, className }: BackendVariantIconProps): React.ReactElement | null {
  const nameLower = variant.name.toLowerCase();
  const labelLower = variant.label?.toLowerCase() ?? '';
  const isRedisValkey = nameLower === 'redis' && labelLower.includes('valkey');
  if (isRedisValkey) {
    return (
      <span className="flex items-center gap-1">
        <BackendIcon backend="redis" className={className} />
        <BackendIcon backend="valkey" className={className} />
      </span>
    );
  }
  return <BackendIcon backend={variant.name} className={className} />;
}
