import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Clock3, ExternalLink, RefreshCw, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

type SaleStatus = 'pending' | 'paid' | 'refused' | 'refunded';

export interface CaktoCheckoutPayload {
  token: string;
  planName: string;
  total: number;
  checkoutUrl: string;
  status: SaleStatus;
}

const labels: Record<SaleStatus, { title: string; description: string }> = {
  pending: { title: 'Aguardando pagamento', description: 'Abra o checkout e conclua o pagamento. Este card será atualizado automaticamente.' },
  paid: { title: 'Comprovante aprovado', description: 'Pagamento confirmado. Seu comprovante e acesso já podem ser liberados.' },
  refused: { title: 'Pagamento recusado', description: 'A Cakto não aprovou esta tentativa. Você pode abrir o checkout e tentar novamente.' },
  refunded: { title: 'Pagamento reembolsado', description: 'Este pagamento foi marcado como reembolsado.' },
};

const CaktoCheckoutCard = ({ payload }: { payload: CaktoCheckoutPayload }) => {
  const [status, setStatus] = useState<SaleStatus>(payload.status);
  const [checking, setChecking] = useState(false);

  const refresh = useCallback(async () => {
    setChecking(true);
    const { data, error } = await supabase.functions.invoke('cakto-checkout', {
      body: { action: 'status', token: payload.token },
    });
    if (!error && data?.status) setStatus(data.status as SaleStatus);
    setChecking(false);
  }, [payload.token]);

  useEffect(() => {
    if (status !== 'pending') return;
    const interval = window.setInterval(() => void refresh(), 5000);
    const onFocus = () => void refresh();
    window.addEventListener('focus', onFocus);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [refresh, status]);

  const Icon = status === 'paid' ? CheckCircle2 : status === 'refused' || status === 'refunded' ? XCircle : Clock3;
  const tone = status === 'paid' ? 'text-green-400' : status === 'refused' || status === 'refunded' ? 'text-red-400' : 'text-amber-300';
  const copy = labels[status];

  return (
    <div className="relative max-w-[92%] w-full bg-[#202c33] rounded-lg overflow-hidden shadow-md">
      <div className="p-3">
        <div className={`flex items-center gap-2 mb-2 ${tone}`}>
          <Icon className="h-5 w-5" />
          <p className="font-bold text-sm">{copy.title}</p>
        </div>
        <p className="font-bold text-white text-sm">{payload.planName}</p>
        <p className="text-2xl font-black text-cinema-glow mb-2">R$ {payload.total.toFixed(2)}</p>
        <p className="text-xs text-white/70 mb-3">{copy.description}</p>
        {status !== 'paid' && status !== 'refunded' && (
          <a href={payload.checkoutUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="cinema" size="sm" className="w-full gap-2">
              <ExternalLink className="h-4 w-4" /> Abrir checkout seguro
            </Button>
          </a>
        )}
        {status === 'pending' && (
          <Button variant="ghost" size="sm" className="mt-1 w-full gap-2 text-white/70" onClick={() => void refresh()} disabled={checking}>
            <RefreshCw className={`h-4 w-4 ${checking ? 'animate-spin' : ''}`} /> Verificar pagamento
          </Button>
        )}
      </div>
    </div>
  );
};

export default CaktoCheckoutCard;