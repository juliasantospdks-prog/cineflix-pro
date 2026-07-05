import { useMemo, useRef, useState } from 'react';
import { Download, MessageCircle, CheckCircle2, Ticket, Copy, Check } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import cineflixLogo from '@/assets/cineflix-logo.png';
import { Plan, Upsell } from '@/types';
import { WHATSAPP_NUMBER } from '@/data/cineflix';

interface ChatReceiptCardProps {
  userName: string;
  plan: Plan;
  selectedUpsells: Upsell[];
}

const ChatReceiptCard = ({ userName, plan, selectedUpsells }: ChatReceiptCardProps) => {
  const ticketRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const now = useMemo(() => new Date(), []);
  const orderId = useMemo(
    () => `CFX-${now.getTime().toString().slice(-8)}`,
    [now]
  );
  const authCode = useMemo(
    () =>
      (orderId + userName)
        .split('')
        .reduce((a, c) => a + c.charCodeAt(0), 0)
        .toString(36)
        .toUpperCase()
        .padStart(6, 'X')
        .slice(-6),
    [orderId, userName]
  );

  const upsellTotal = selectedUpsells.reduce((s, u) => s + u.price, 0);
  const total = plan.price + upsellTotal;

  // Generate stable synthetic access credentials
  const credentials = useMemo(() => {
    const clean = (userName || 'user').toLowerCase().replace(/[^a-z]/g, '').slice(0, 6) || 'user';
    const suffix = orderId.slice(-4);
    return {
      user: `${clean}${suffix}`,
      password: authCode.toLowerCase() + Math.floor(Math.random() * 90 + 10),
      server: 'srv-01.cineflixpayment.com',
    };
  }, [userName, orderId, authCode]);

  const copy = (label: string, value: string) => {
    navigator.clipboard?.writeText(value).then(() => {
      setCopied(label);
      setTimeout(() => setCopied((c) => (c === label ? null : c)), 1600);
    });
  };

  const handlePDF = async () => {
    if (!ticketRef.current || downloading) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(ticketRef.current, {
        backgroundColor: '#0b141a',
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const img = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pw = pdf.internal.pageSize.getWidth();
      const ph = pdf.internal.pageSize.getHeight();
      const m = 10;
      const iw = pw - m * 2;
      const ih = (canvas.height * iw) / canvas.width;
      pdf.setFillColor(11, 20, 26);
      pdf.rect(0, 0, pw, ph, 'F');
      if (ih <= ph - m * 2) {
        pdf.addImage(img, 'PNG', m, m, iw, ih);
      } else {
        let pos = 0;
        let rem = ih;
        let page = 0;
        while (rem > 0) {
          if (page > 0) {
            pdf.addPage();
            pdf.setFillColor(11, 20, 26);
            pdf.rect(0, 0, pw, ph, 'F');
          }
          pdf.addImage(img, 'PNG', m, m - pos, iw, ih);
          rem -= ph - m * 2;
          pos += ph - m * 2;
          page++;
        }
      }
      pdf.save(`comprovante-cineflix-${orderId}.pdf`);
    } finally {
      setDownloading(false);
    }
  };

  const handleWhatsApp = () => {
    const upsellLines = selectedUpsells
      .map((u) => `• ${u.name} — R$ ${u.price.toFixed(2)}`)
      .join('\n');
    const msg = [
      `*Comprovante CINEFLIXPAYMENT* 🎬`,
      `Pedido: ${orderId}`,
      ``,
      `Cliente: ${userName}`,
      `Plano: ${plan.name}`,
      selectedUpsells.length ? `\nAdicionais:\n${upsellLines}` : '',
      ``,
      `*Total: R$ ${total.toFixed(2)}*`,
      `Cód. autenticação: ${authCode}`,
      ``,
      `Olá! Confirmando meu pedido acima 🙏`,
    ]
      .filter(Boolean)
      .join('\n');
    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`,
      '_blank'
    );
  };

  return (
    <div className="w-full max-w-[340px] space-y-2">
      {/* Ticket */}
      <div
        ref={ticketRef}
        className="rounded-2xl overflow-hidden bg-gradient-to-b from-[#0a0a0a] to-black border border-cinema-red/40 shadow-2xl"
      >
        {/* Header */}
        <div className="relative px-4 py-3 bg-gradient-to-br from-cinema-red via-red-800 to-black text-center">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/50 border border-white/20 mb-1.5">
            <Ticket className="w-3 h-3 text-white" />
            <span className="text-white text-[9px] font-bold tracking-[0.25em]">
              COMPROVANTE
            </span>
          </div>
          <img
            src={cineflixLogo}
            alt="CineflixPayment"
            className="h-6 mx-auto"
            crossOrigin="anonymous"
          />
        </div>

        {/* Status */}
        <div className="px-4 pt-3">
          <div className="flex items-center justify-between text-[10px]">
            <span className="flex items-center gap-1 text-green-400 font-bold">
              <CheckCircle2 className="w-3 h-3" />
              PAGAMENTO CONFIRMADO
            </span>
            <span className="text-white/50 font-mono">#{orderId}</span>
          </div>
        </div>

        {/* Cliente / plano */}
        <div className="px-4 pt-3 space-y-2 text-sm">
          <div>
            <p className="text-white/40 text-[9px] uppercase tracking-widest">Cliente</p>
            <p className="text-white font-bold truncate">{userName || 'Cliente'}</p>
          </div>
          <div className="rounded-lg bg-cinema-red/10 border border-cinema-red/30 p-2.5">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-white/50 text-[9px] uppercase tracking-widest">Plano</p>
                <p className="text-white font-bold text-sm truncate">{plan.name}</p>
              </div>
              <p className="text-cinema-glow font-black">R$ {plan.price.toFixed(2)}</p>
            </div>
          </div>

          {selectedUpsells.length > 0 && (
            <div className="rounded-lg bg-white/[0.03] border border-white/10 p-2.5 space-y-1">
              <p className="text-white/40 text-[9px] uppercase tracking-widest">Adicionais</p>
              {selectedUpsells.map((u) => (
                <div key={u.id} className="flex justify-between text-xs">
                  <span className="text-white/80 truncate pr-2">{u.name}</span>
                  <span className="text-white font-mono">+R$ {u.price.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Credenciais */}
        <div className="px-4 pt-3">
          <p className="text-cinema-red text-[9px] uppercase tracking-widest font-bold mb-1.5">
            🔐 Seus dados de acesso
          </p>
          <div className="rounded-lg bg-black/50 border border-cinema-red/20 divide-y divide-white/5">
            {[
              { label: 'Usuário', value: credentials.user },
              { label: 'Senha', value: credentials.password },
              { label: 'Servidor', value: credentials.server },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between px-2.5 py-2">
                <div className="min-w-0">
                  <p className="text-white/40 text-[9px] uppercase">{row.label}</p>
                  <p className="text-white font-mono text-xs truncate">{row.value}</p>
                </div>
                <button
                  onClick={() => copy(row.label, row.value)}
                  className="text-white/50 hover:text-white text-[10px] flex items-center gap-1 flex-shrink-0"
                  aria-label={`Copiar ${row.label}`}
                >
                  {copied === row.label ? (
                    <>
                      <Check className="w-3 h-3 text-green-400" />
                      <span className="text-green-400">Ok</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      Copiar
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Total */}
        <div className="px-4 py-3 mt-3">
          <div
            className="rounded-lg px-3 py-2.5 flex items-center justify-between text-white"
            style={{
              background:
                'linear-gradient(135deg, #dc2626 0%, #7f1d1d 100%)',
              boxShadow: '0 0 20px rgba(220,38,38,0.35)',
            }}
          >
            <span className="text-[10px] uppercase tracking-widest opacity-80">
              Total pago
            </span>
            <span className="text-xl font-black">R$ {total.toFixed(2)}</span>
          </div>
        </div>

        <div className="px-4 pb-3 flex items-center justify-between text-[9px] text-white/40">
          <span className="font-mono">Auth: {authCode}</span>
          <span>
            {now.toLocaleDateString('pt-BR')} · {now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={handlePDF}
          disabled={downloading}
          className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 active:bg-white/20 text-white text-xs font-semibold border border-white/15 transition disabled:opacity-60"
        >
          <Download className="w-4 h-4" />
          {downloading ? 'Gerando...' : 'Baixar PDF'}
        </button>
        <button
          onClick={handleWhatsApp}
          className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20b855] active:bg-[#1a9c47] text-white text-xs font-bold shadow-lg shadow-[#25D366]/20 transition"
        >
          <MessageCircle className="w-4 h-4" />
          Enviar WhatsApp
        </button>
      </div>
    </div>
  );
};

export default ChatReceiptCard;
