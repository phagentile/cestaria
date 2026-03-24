'use client';

import { useSyncStore } from '@/lib/use-sync';
import { Wifi, WifiOff, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

export function SyncIndicator() {
  const { status, lastSync } = useSyncStore();
  const { t } = useI18n();

  const timeStr = lastSync
    ? lastSync.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    : null;

  if (status === 'idle') return null;

  const config = {
    syncing: {
      icon: <RefreshCw className="w-3.5 h-3.5 animate-spin" />,
      label: t('sync.syncing'),
      cls: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    },
    online: {
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
      label: timeStr ? `${t('sync.synced')} ${timeStr}` : t('sync.synced'),
      cls: 'text-green-400 bg-green-500/10 border-green-500/20',
    },
    offline: {
      icon: <WifiOff className="w-3.5 h-3.5" />,
      label: t('sync.offline'),
      cls: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    },
    error: {
      icon: <AlertCircle className="w-3.5 h-3.5" />,
      label: t('sync.error'),
      cls: 'text-red-400 bg-red-500/10 border-red-500/20',
    },
  }[status] ?? {
    icon: <Wifi className="w-3.5 h-3.5" />,
    label: '',
    cls: 'text-gray-400',
  };

  return (
    <div
      className={`flex items-center gap-1.5 px-2 py-1 rounded-full border text-[11px] font-medium ${config.cls}`}
      title={config.label}
    >
      {config.icon}
      <span className="hidden sm:inline">{config.label}</span>
    </div>
  );
}
