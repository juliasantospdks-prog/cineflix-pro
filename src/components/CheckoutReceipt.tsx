import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  CheckCircle2, Clock, CreditCard, MessageCircle, ArrowLeft,
  ShieldCheck, Ticket, Film, Lock, Headphones, Sparkles, Star, Calendar, Download, X,
} from 'lucide-react';
import { plans, upsells, WHATSAPP_NUMBER } from '@/data/cineflix';
import cineflixLogo from '@/assets/cineflix-logo.png';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Heurística simples de gênero pelo primeiro nome (PT-BR)
const detectGender = (fullName: string): 'male' | 'female' => {
  const first = (fullName || '').trim().split(/\s+/)[0]?.toLowerCase() || '';
  const maleExceptions = ['luca', 'costa', 'sasha', 'jose', 'josé', 'andre', 'andré', 'igor', 'thomas', 'lucas', 'jonas', 'silas', 'elias', 'tobias', 'matias', 'nicolas', 'nicholas', 'douglas'];
  const femaleExceptions = ['tais', 'taís', 'ines', 'inês', 'beatris', 'beatriz', 'isis', 'íris', 'iris', 'carmen', 'miriam', 'raquel', 'isabel', 'ester', 'esther', 'agnes'];
  if (femaleExceptions.includes(first)) return 'female';
  if (maleExceptions.includes(first)) return 'male';
  const last = first.slice(-1);
  if (last === 'a') return 'female';
  return 'male';
};

const CheckoutReceipt = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [downloading, setDownloading] = useState(false);
  const ticketRef = useRef<HTMLDivElement>(null);

  const planId = searchParams.get('plano') || '';
  const nome = searchParams.get('nome') || 'Cliente';
  const email = searchParams.get('email') || '';
  const upsellIds = searchParams.get('upsells')?.split(',').filter(Boolean) || [];
  const plan = plans.find(p => p.id === planId);
  const selectedUpsells = upsellIds.map(id => upsells.find(u => u.id === id)).filter(Boolean);

  useEffect(() => { setCurrentTime(new Date()); }, []);

  if (!plan) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-white text-center">
          <p className="text-xl mb-4">Plano não encontrado</p>
          <button onClick={() => navigate('/')} className="text-red-500 underline">Voltar ao início</button>
        </div>
      </div>
    );
  }

  const upsellTotal = selectedUpsells.reduce((sum, u) => sum + (u?.price || 0), 0);
  const total = plan.price + upsellTotal;
  const hasUpsells = selectedUpsells.length > 0;
  const orderId = `CFX-${currentTime.getTime().toString().slice(-8)}`;
  const authCode = (orderId + nome).split('').reduce((a, c) => a + c.charCodeAt(0), 0).toString(36).toUpperCase().padStart(6, 'X').slice(-6);

  const dateStr = currentTime.toLocaleDateString('pt-BR');
  const timeStr = currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const validityLabel = (() => {
    const d = new Date(currentTime);
    if (plan.id === 'apk') return 'Acesso vitalício';
    if (plan.id === 'anual') { d.setFullYear(d.getFullYear() + 1); return `Válido até ${d.toLocaleDateString('pt-BR')}`; }
    if (plan.id === 'trimestral') { d.setMonth(d.getMonth() + 3); return `Válido até ${d.toLocaleDateString('pt-BR')}`; }
    d.setMonth(d.getMonth() + 1); return `Válido até ${d.toLocaleDateString('pt-BR')}`;
  })();

  const buildWhatsMessage = () => {
    const upsellLines = selectedUpsells
      .map(u => u ? `• ${u.name} — R$ ${u.price.toFixed(2)}` : '')
      .filter(Boolean).join('\n');
    return [
      `*Pedido CINEFLIXPAYMENT* (${orderId})`, ``,
      `Cliente: ${nome}`, email ? `E-mail: ${email}` : '', ``,
      `Plano: ${plan.name} — R$ ${plan.price.toFixed(2)} (${plan.period})`,
      hasUpsells ? `\nAdicionais:\n${upsellLines}` : '', ``,
      `*Total: R$ ${total.toFixed(2)}*`, ``,
      `Código de autenticação: ${authCode}`,
      `Quero finalizar meu pedido agora.`,
    ].filter(Boolean).join('\n');
  };

  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const gender = detectGender(nome);
  const querido = gender === 'female' ? 'MINHA QUERIDA' : 'MEU QUERIDO';
  const conhecer = gender === 'female' ? 'minha nova cliente' : 'meu novo cliente';

  const handlePayCard = () => setShowFinalizeModal(true);
  const handlePayWhats = () => {
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(buildWhatsMessage())}`, '_blank');
  };
  const handleGoToWhats = () => {
    setShowFinalizeModal(false);
    handlePayWhats();
  };

  const handleDownloadPDF = async () => {
    if (!ticketRef.current || downloading) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(ticketRef.current, {
        backgroundColor: '#000000',
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const imgWidth = pageWidth - margin * 2;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.setFillColor(0, 0, 0);
      pdf.rect(0, 0, pageWidth, pageHeight, 'F');

      if (imgHeight <= pageHeight - margin * 2) {
        pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight);
      } else {
        // Multi-page handling
        let position = 0;
        const pageContentHeight = pageHeight - margin * 2;
        let remaining = imgHeight;
        let page = 0;
        while (remaining > 0) {
          if (page > 0) {
            pdf.addPage();
            pdf.setFillColor(0, 0, 0);
            pdf.rect(0, 0, pageWidth, pageHeight, 'F');
          }
          pdf.addImage(imgData, 'PNG', margin, margin - position, imgWidth, imgHeight);
          remaining -= pageContentHeight;
          position += pageContentHeight;
          page++;
        }
      }

      pdf.save(`comprovante-${orderId}.pdf`);
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
    } finally {
      setDownloading(false);
    }
  };

  const barcodeBars = Array.from({ length: 56 }, (_, i) => {
    const w = (i * 7) % 5 === 0 ? 3 : (i % 3 === 0 ? 2 : 1);
    return <div key={i} className="bg-white" style={{ width: `${w}px`, height: '100%' }} />;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-zinc-950 to-black flex items-center justify-center p-4 py-8 relative overflow-hidden">
      {/* Atmosfera cinema */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-red-900/20 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-white/60 hover:text-white text-sm mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao início
        </button>

        {/* TICKET */}
        <div
          ref={ticketRef}
          className="rounded-3xl overflow-hidden shadow-2xl bg-black relative"
          style={{
            backgroundImage: 'linear-gradient(180deg, #0a0a0a 0%, #000 100%)',
            boxShadow: '0 0 60px rgba(220, 38, 38, 0.25), 0 0 0 1px rgba(220, 38, 38, 0.4)',
          }}
        >
          {/* Faixa cinematográfica superior (perfurações de filme) */}
          <div className="h-4 bg-black flex items-center justify-around px-2 border-b border-red-600/30">
            {Array.from({ length: 14 }).map((_, i) => (
              <div key={i} className="w-2 h-2 rounded-sm bg-red-600/40" />
            ))}
          </div>

          {/* HEADER */}
          <div className="relative px-6 py-7 text-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-red-700 via-red-900 to-black" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.25),transparent_60%)]" />
            <div className="absolute inset-0 opacity-20" style={{
              backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.05) 10px, rgba(255,255,255,0.05) 20px)'
            }} />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/60 border border-white/30 mb-3 backdrop-blur-sm">
                <Ticket className="w-3.5 h-3.5 text-white" />
                <span className="text-white text-[10px] font-bold tracking-[0.3em]">INGRESSO PREMIUM</span>
              </div>
              <img src={cineflixLogo} alt="Logo CineflixPayment" className="h-11 mx-auto mb-2 drop-shadow-lg" crossOrigin="anonymous" />
              <h1 className="text-white text-[11px] tracking-[0.4em] font-bold">COMPROVANTE OFICIAL</h1>
              <p className="text-white/70 text-[10px] mt-1 italic">Sua sessão começa após a confirmação</p>
            </div>
          </div>

          {/* STATUS */}
          <div className="px-6 pt-5">
            <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-yellow-500/15 via-yellow-500/10 to-transparent border border-yellow-500/40 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-400 animate-pulse" />
                <span className="text-yellow-300 text-xs font-bold tracking-wide">AGUARDANDO PAGAMENTO</span>
              </div>
              <span className="text-white/60 text-[10px] font-mono">#{orderId}</span>
            </div>
          </div>

          {/* CLIENTE + AUTH */}
          <div className="px-6 pt-5 grid grid-cols-2 gap-4">
            <div className="min-w-0">
              <p className="text-white/40 text-[10px] uppercase tracking-widest mb-1">Cliente</p>
              <p className="text-white font-bold truncate">{nome}</p>
              {email && <p className="text-white/60 text-[11px] truncate">{email}</p>}
            </div>
            <div className="text-right min-w-0">
              <p className="text-white/40 text-[10px] uppercase tracking-widest mb-1">Cód. Autenticação</p>
              <p className="text-red-500 font-mono font-bold tracking-widest">{authCode}</p>
              <p className="text-white/40 text-[10px]">{dateStr} · {timeStr}</p>
            </div>
          </div>

          <div className="mx-6 my-4 border-t border-dashed border-red-600/30" />

          {/* PLANO */}
          <div className="px-6">
            <p className="text-white/40 text-[10px] uppercase tracking-widest mb-3">Plano selecionado</p>
            <div className="rounded-2xl bg-gradient-to-br from-red-950/60 via-black to-red-950/30 border border-red-600/40 p-4 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-red-600/20 rounded-full blur-2xl" />
              <div className="relative">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-red-900 border border-red-500/60 flex items-center justify-center flex-shrink-0 shadow-lg">
                      <Film className="w-6 h-6 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-bold leading-tight">{plan.name}</p>
                      <p className="text-white/60 text-[11px]">
                        {plan.period === 'único' ? 'Pagamento único · Vitalício' : `Cobrança ${plan.period}`}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-white font-bold whitespace-nowrap">R$ {plan.price.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-white/70 pt-2 border-t border-red-600/20">
                  <Calendar className="w-3.5 h-3.5 text-red-500" />
                  {validityLabel}
                </div>
              </div>
            </div>
          </div>

          {/* ADICIONAIS */}
          {hasUpsells && (
            <>
              <div className="mx-6 my-4 border-t border-dashed border-red-600/30" />
              <div className="px-6">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-red-500 text-[10px] uppercase tracking-widest font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Adicionais
                  </p>
                  <span className="text-white/40 text-[10px]">{selectedUpsells.length} item(ns)</span>
                </div>
                <div className="space-y-2 rounded-xl bg-white/[0.03] border border-white/10 p-3">
                  {selectedUpsells.map((u) => u && (
                    <div key={u.id} className="flex items-start justify-between gap-3 pb-2 last:pb-0 last:border-0 border-b border-white/5">
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        <CheckCircle2 className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <p className="text-white text-sm font-medium truncate">{u.name}</p>
                          {u.description && (
                            <p className="text-white/50 text-[11px] line-clamp-2">{u.description}</p>
                          )}
                        </div>
                      </div>
                      <p className="text-white text-sm whitespace-nowrap font-bold">+R$ {u.price.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* SUBTOTAIS */}
          <div className="mx-6 my-4 border-t border-dashed border-red-600/30" />
          <div className="px-6 space-y-1.5 text-sm">
            <div className="flex items-center justify-between text-white/60">
              <span>Subtotal plano</span>
              <span>R$ {plan.price.toFixed(2)}</span>
            </div>
            {hasUpsells && (
              <div className="flex items-center justify-between text-white/60">
                <span>Subtotal adicionais</span>
                <span>R$ {upsellTotal.toFixed(2)}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-white/60">
              <span>Desconto aplicado</span>
              <span className="text-green-400">— R$ 0,00</span>
            </div>
          </div>

          {/* TOTAL */}
          <div className="px-6 mt-4">
            <div className="relative rounded-2xl px-4 py-4 flex items-center justify-between overflow-hidden border border-red-500"
              style={{
                background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 50%, #7f1d1d 100%)',
                boxShadow: '0 0 30px rgba(220,38,38,0.5)',
              }}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent_60%)]" />
              <div className="relative">
                <p className="text-white/80 text-[10px] uppercase tracking-widest">Total a pagar</p>
                <p className="text-white text-3xl font-bold leading-none mt-1">R$ {total.toFixed(2)}</p>
              </div>
              <div className="text-right relative">
                <p className="text-white/80 text-[10px]">Em até</p>
                <p className="text-white font-bold text-sm">12x no cartão</p>
              </div>
            </div>
          </div>

          {/* GARANTIAS */}
          <div className="px-6 pt-5 grid grid-cols-3 gap-2">
            {[
              { icon: ShieldCheck, color: 'text-green-400', label: 'Compra\nsegura' },
              { icon: Lock, color: 'text-red-500', label: 'Dados\nprotegidos' },
              { icon: Headphones, color: 'text-white', label: 'Suporte\n24/7' },
            ].map((item, i) => (
              <div key={i} className="rounded-xl bg-white/[0.03] border border-white/10 p-2.5 text-center">
                <item.icon className={`w-4 h-4 ${item.color} mx-auto mb-1`} />
                <p className="text-white/70 text-[10px] font-bold leading-tight whitespace-pre-line">{item.label}</p>
              </div>
            ))}
          </div>

          {/* PERFURAÇÃO TICKET */}
          <div className="relative my-5">
            <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black border border-red-600/40" />
            <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black border border-red-600/40" />
            <div className="mx-6 border-t-2 border-dashed border-red-600/40" />
          </div>

          {/* CANHOTO */}
          <div className="px-6 pb-6">
            <div className="rounded-xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/10 p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-white/40 text-[10px] uppercase tracking-widest">Canhoto · Stub</p>
                <p className="text-white/40 text-[10px] font-mono">{orderId}</p>
              </div>
              <div className="h-12 flex items-center gap-[1px] bg-white rounded px-2">
                {barcodeBars}
              </div>
              <p className="text-center text-white/60 text-[10px] mt-2 font-mono tracking-widest">
                {orderId} · {authCode}
              </p>
            </div>

            <p className="text-center text-white/40 text-[10px] mt-4">
              Obrigado por escolher a <span className="text-red-500 font-bold">CINEFLIXPAYMENT</span>.
            </p>
          </div>

          {/* Faixa filme inferior */}
          <div className="h-4 bg-black flex items-center justify-around px-2 border-t border-red-600/30">
            {Array.from({ length: 14 }).map((_, i) => (
              <div key={i} className="w-2 h-2 rounded-sm bg-red-600/40" />
            ))}
          </div>
        </div>

        {/* AÇÕES (fora do print) */}
        <div className="mt-5 space-y-3">
          <button
            onClick={handlePayCard}
            className="w-full py-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-600/40 transition-all duration-300 hover:scale-[1.02]"
          >
            <CreditCard className="w-5 h-5" />
            Finalizar pagamento
          </button>
          <button
            onClick={handlePayWhats}
            className="w-full py-4 rounded-xl bg-black border border-white/20 hover:border-green-500/60 text-white font-bold flex items-center justify-center gap-2 transition-all duration-300"
          >
            <MessageCircle className="w-5 h-5 text-green-400" />
            Finalizar no WhatsApp
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-zinc-900 to-black border border-red-600/40 hover:border-red-500 text-white font-bold flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-60"
          >
            <Download className="w-5 h-5 text-red-500" />
            {downloading ? 'Gerando PDF...' : 'Baixar comprovante em PDF'}
          </button>
        </div>
      </div>

      {/* MODAL: Calma, meu querido / minha querida */}
      {showFinalizeModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowFinalizeModal(false)}
        >
          <div
            className="relative w-full max-w-md rounded-3xl overflow-hidden bg-black border border-red-600/50 shadow-2xl"
            style={{ boxShadow: '0 0 60px rgba(220,38,38,0.4)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Faixa cinema topo */}
            <div className="h-4 bg-black flex items-center justify-around px-2 border-b border-red-600/40">
              {Array.from({ length: 14 }).map((_, i) => (
                <div key={i} className="w-2 h-2 rounded-sm bg-red-600/50" />
              ))}
            </div>

            {/* Header vermelho */}
            <div className="relative px-6 py-7 text-center overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-red-700 via-red-900 to-black" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.25),transparent_60%)]" />
              <button
                onClick={() => setShowFinalizeModal(false)}
                className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 flex items-center justify-center text-white/80 hover:text-white transition-colors"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/60 border border-white/30 mb-3 backdrop-blur-sm">
                  <Ticket className="w-3.5 h-3.5 text-white" />
                  <span className="text-white text-[10px] font-bold tracking-[0.3em]">CINEFLIXPAYMENT</span>
                </div>
                <h2 className="font-cinema text-white text-2xl font-bold tracking-wide">
                  CALMA, {querido}!
                </h2>
              </div>
            </div>

            {/* Corpo */}
            <div className="px-6 py-6 space-y-4 text-white/85 text-sm leading-relaxed">
              <p>
                Gostaria de conhecer {conhecer}. Eu prezo muito em ter uma{' '}
                <span className="text-red-500 font-semibold">boa relação com meus clientes</span> — por isso jamais vou receber algo seu sem antes conversar com você.
              </p>
              <p>
                Você pode até encontrar algo mais barato, mas <span className="text-red-500 font-semibold">não presta</span>. O que estou te oferecendo não é um plano qualquer e nem uma assinatura comum — é uma <span className="text-red-500 font-semibold">experiência única</span>.
              </p>
              <p>
                Por isso preciso que você me chame agora no WhatsApp, para que eu possa te receber da melhor forma possível.
              </p>
              <p className="italic text-white/70">Um xeiro.</p>

              <div className="border-t border-dashed border-red-600/30 pt-4 space-y-3">
                <button
                  onClick={handleGoToWhats}
                  className="w-full py-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-600/50 transition-all duration-300 hover:scale-[1.02]"
                >
                  <MessageCircle className="w-5 h-5" />
                  FALAR COM A CINEFLIXPAYMENT
                </button>
                <button
                  onClick={() => setShowFinalizeModal(false)}
                  className="w-full py-3 rounded-xl bg-transparent border border-white/20 hover:border-white/40 text-white/80 font-semibold text-sm transition-all"
                >
                  AGORA NÃO
                </button>
              </div>
            </div>

            {/* Faixa cinema base */}
            <div className="h-4 bg-black flex items-center justify-around px-2 border-t border-red-600/40">
              {Array.from({ length: 14 }).map((_, i) => (
                <div key={i} className="w-2 h-2 rounded-sm bg-red-600/50" />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutReceipt;
