'use client';
import { useEffect, useState } from 'react';
import type { Payment, PaymentScenario, ProviderProfile } from '@psa/contracts';

const cases: { code: PaymentScenario; label: string; detail: string; icon: string }[] = [
  { code: 'accepted', label: 'Paiement accepté', detail: 'Confirmation réussie', icon: '✓' },
  { code: 'declined', label: 'Paiement refusé', detail: 'Refus simulé', icon: '×' },
  { code: 'insufficient_funds', label: 'Solde insuffisant', detail: 'Fonds disponibles insuffisants', icon: '₣' },
  { code: 'invalid_number', label: 'Numéro invalide', detail: 'Format de numéro incorrect', icon: '#' },
  { code: 'unknown_number', label: 'Numéro inconnu', detail: 'Compte de test non reconnu', icon: '?' },
  { code: 'expired', label: 'Demande expirée', detail: 'Expiration du délai de confirmation', icon: '◷' },
  { code: 'abandoned', label: 'Paiement abandonné', detail: 'Le client annule le parcours', icon: '↶' },
  { code: 'pending', label: 'Paiement en attente', detail: 'Garder la transaction ouverte', icon: '…' },
  { code: 'timeout', label: 'Timeout opérateur', detail: 'Aucune réponse dans le délai prévu', icon: '⌛' },
  { code: 'technical_error', label: 'Erreur technique', detail: 'Erreur réseau ou technique', icon: '⚠' },
  { code: 'provider_unavailable', label: 'Fournisseur indisponible', detail: 'Profil momentanément indisponible', icon: '⊘' },
];
const shortName: Record<string, string> = { mtn_benin: 'MTN MoMo', moov_benin: 'Moov Money', celtiis_benin: 'Celtiis Cash' };
export default function SimulatorPage() {
  const [scenario, setScenario] = useState<PaymentScenario>('accepted');
  const [provider, setProvider] = useState('mtn_benin');
  const [amount, setAmount] = useState('12500');
  const [phone, setPhone] = useState('0197000000');
  const [profiles, setProfiles] = useState<ProviderProfile[]>([]);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [state, setState] = useState<'idle'|'created'|'running'|'done'>('idle');
  useEffect(() => { fetch('/v1/providers').then(r => r.json()).then(x => setProfiles(x.data ?? [])).catch(() => undefined); }, []);
  async function start() {
    setError(''); setBusy(true); setPayment(null); setState('idle');
    try {
      const created = await fetch('/v1/payments', { method: 'POST', headers: { 'content-type': 'application/json', 'X-PSA-Request': 'dashboard', 'Idempotency-Key': `ui-${crypto.randomUUID()}` }, body: JSON.stringify({ provider, amount: Number(amount), phoneNumber: phone, scenario: 'pending' }) });
      if (created.status === 401) { location.href = '/login'; return; }
      if (!created.ok) throw new Error((await created.json()).message ?? 'Impossible de créer le paiement');
      const p = (await created.json()).data as Payment; setPayment(p); setState('created');
      const run = await fetch(`/v1/simulations/payments/${p.id}/run`, { method: 'POST', headers: { 'content-type': 'application/json', 'X-PSA-Request': 'dashboard' }, body: JSON.stringify({ scenario }) });
      if (!run.ok) throw new Error((await run.json()).message ?? 'Le scénario n’a pas pu être exécuté');
      const result = (await run.json()).data as Payment; setPayment(result); setState('done');
    } catch (e) { setError(e instanceof Error ? e.message : 'Erreur de simulation'); }
    finally { setBusy(false); }
  }
  const selected = cases.find(s => s.code === scenario)!;
  const statusLabel = payment?.status ?? 'PRÊT';
  return <><header className="topbar"><div><span className="breadcrumb">Workspace <b>/</b> Simulateur</span><h1>Simulateur de paiements</h1></div><span className="live-status"><i/> MODE TEST</span></header>
    <section className="notice-banner"><span className="notice-icon">i</span><div><strong>Zone de test — aucune opération réelle</strong><p>Le PIN est fictif et n’est jamais envoyé à un opérateur. Aucun fonds n’est collecté ou transféré.</p></div><span className="banner-chip">SIMULATION</span></section>
    {error && <div className="toast" role="alert">{error}</div>}
    <div className="sim-layout"><section className="panel sim-controls"><div className="panel-heading"><div><span className="eyebrow">CONFIGURER UN TEST</span><h2>Paramètres du paiement</h2></div><span className="count-pill">11 SCÉNARIOS</span></div>
      <div className="form-grid"><label>Fournisseur sandbox<select value={provider} onChange={e => setProvider(e.target.value)}>{(profiles.length ? profiles : [{ code:'mtn_benin',name:'MTN Mobile Money' },{ code:'moov_benin',name:'Moov Money' },{ code:'celtiis_benin',name:'Celtiis Cash' }] as ProviderProfile[]).map(p => <option key={p.code} value={p.code}>{p.name.split(' (')[0]}</option>)}</select></label><label>Montant (XOF)<input inputMode="numeric" value={amount} onChange={e => setAmount(e.target.value.replace(/\D/g,''))}/></label><label className="wide">Numéro de test<input value={phone} onChange={e => setPhone(e.target.value)} maxLength={20}/><small>Numéro fictif uniquement; n’utilisez aucune donnée sensible.</small></label></div>
      <div className="scenario-title"><div><span className="eyebrow">CHOISIR UN RÉSULTAT</span><p>Le test sera lancé immédiatement sur le paiement créé.</p></div></div>
      <div className="scenario-grid">{cases.map(c => <button key={c.code} className={`scenario-card ${scenario===c.code?'chosen':''}`} onClick={() => setScenario(c.code)} type="button"><span className="scenario-icon">{c.icon}</span><span className="scenario-copy"><strong>{c.label}</strong><small>{c.detail}</small></span><span className="radio-dot"/></button>)}</div>
      <button className="button primary run-button" onClick={start} disabled={busy || !amount || Number(amount)<=0 || !phone}>{busy ? 'Exécution du scénario…' : '▶  Lancer la simulation'}</button>
    </section>
    <aside className="sim-aside"><div className="panel phone-panel"><div className="panel-heading"><div><span className="eyebrow">APERÇU INTERACTIF</span><h2>Téléphone virtuel</h2></div><span className="live-status"><i/>{state === 'done' ? 'TERMINÉ' : state === 'created' ? 'EN COURS' : 'PRÊT'}</span></div><div className="phone-frame"><div className="phone-notch"/><div className="phone-screen"><div className="phone-status"><span>9:41</span><span>● ● ▮</span></div><div className="operator-brand"><span className="operator-icon">{provider==='mtn_benin'?'M':provider==='moov_benin'?'M':'C'}</span><span>{shortName[provider] ?? 'Mobile Money'}<small>Confirmation de paiement</small></span></div><div className="ussd-message">{state==='idle' ? <>Confirmez-vous le paiement de <b>{Number(amount||0).toLocaleString('fr-FR')} XOF</b> à Payment Sandbox Africa ?</> : state==='created' ? <>Demande envoyée au numéro <b>{phone}</b>.<br/>Simulation du scénario <b>{selected.label}</b>…</> : <><b>{selected.label}</b><br/>{payment?.status === 'SUCCESS' ? 'Paiement confirmé.' : payment?.status === 'FAILED' ? 'Paiement non abouti.' : payment?.status === 'EXPIRED' ? 'Demande expirée.' : payment?.status === 'CANCELLED' ? 'Parcours abandonné.' : 'Le paiement reste en attente.'}<br/><small>Référence : {payment?.reference}</small></>}</div><label className="pin-label">Code PIN fictif</label><div className="pin-box">••••</div><div className="phone-buttons"><span>Annuler</span><span>Confirmer</span></div><div className="phone-keypad">{['1','2','3','4','5','6','7','8','9','*','0','#'].map(k=><span key={k}>{k}</span>)}</div></div></div><p className="phone-caption">Simulation visuelle uniquement — le PIN n’est pas transmis.</p></div>
      <div className="panel sim-result"><span className="eyebrow">RÉSULTAT DU TEST</span><div className="result-line"><div><small>ÉTAT COURANT</small><strong className={`status status-${(payment?.status??'pending').toLowerCase()}`}><i/>{statusLabel}</strong></div><div><small>SCÉNARIO</small><strong>{selected.code}</strong></div></div>{payment && <div className="event-timeline">{payment.events.map(ev=><div className="timeline-item" key={ev.id}><span className="timeline-dot"/><div><strong>{ev.type}</strong><small>{new Date(ev.occurredAt).toLocaleTimeString('fr-FR')}</small></div></div>)}</div>}{!payment && <p className="provider-note">Choisissez un scénario puis lancez le test pour voir les transitions d’état et les événements.</p>}</div></aside></div>
  </>;
}
