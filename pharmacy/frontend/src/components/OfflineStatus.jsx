import { useEffect, useState } from 'react';
import syncService from '../services/syncService';

export default function OfflineStatus() {
  const [online, setOnline] = useState(() => navigator.onLine);
  const [pending, setPending] = useState(0);

  useEffect(() => {
    let mounted = true;
    const refresh = async () => {
      if (mounted) setOnline(navigator.onLine);
      const count = await syncService.getPendingSyncCount();
      if (mounted) setPending(count);
    };
    const onOnline = () => { setOnline(true); syncService.sync().catch(console.error).finally(refresh); };
    const onOffline = () => setOnline(false);
    refresh();
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    const timer = window.setInterval(refresh, 5000);
    return () => {
      mounted = false;
      window.clearInterval(timer);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  return (
    <div className="fixed right-3 top-3 z-[150] flex items-center gap-2 rounded-full border bg-white/95 px-3 py-1.5 text-[10px] font-black uppercase shadow-lg backdrop-blur">
      <span className={`h-2 w-2 rounded-full ${online ? 'bg-emerald-500' : 'bg-red-500'}`} />
      <span className={online ? 'text-emerald-700' : 'text-red-700'}>{online ? 'Online' : 'Offline'}</span>
      {pending > 0 && <span className="border-l border-slate-200 pl-2 text-amber-700">{pending} pending sync</span>}
    </div>
  );
}
