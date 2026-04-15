import React, { useState, useRef, useCallback } from "react";

// ─── Constants ────────────────────────────────────────────────────────────────
const WHATSAPP_NUMBER   = "33603908935";
const PAYPAL_EMAIL      = "mandiayediallo@gmail.com";
const WERO_NUMBER       = "06 59 01 25 99";
const WAVE_NUMBER       = "+221 77 181 33 44";

// ⚠️ Colle ici l'URL de ton déploiement Google Apps Script (le même que pour la boutique)
const SHEETS_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbyrfnrWvErokZhGmTRGw0k39h3l1nIxYCdBcr7XxlV4SygPrCRaZEQKMnNwYdjQTuQuKw/exec";

const COUNTRY_CODES = [
   { code: "+33",  flag: "🇫🇷", label: "France"        },
  { code: "+32",  flag: "🇧🇪", label: "Belgique"      },
  { code: "+41",  flag: "🇨🇭", label: "Suisse"        },
  { code: "+352", flag: "🇱🇺", label: "Luxembourg"    },
  { code: "+1",   flag: "🇨🇦", label: "Canada"        },
  { code: "+221", flag: "🇸🇳", label: "Sénégal"       },
  { code: "+225", flag: "🇨🇮", label: "Côte d'Ivoire" },
  { code: "+223", flag: "🇲🇱", label: "Mali"          },
  { code: "+224", flag: "🇬🇳", label: "Guinée"        },
  { code: "+237", flag: "🇨🇲", label: "Cameroun"      },
  { code: "+242", flag: "🇨🇬", label: "Congo"         },
  { code: "+243", flag: "🇨🇩", label: "RD Congo"      },
  { code: "+212", flag: "🇲🇦", label: "Maroc"         },
  { code: "+216", flag: "🇹🇳", label: "Tunisie"       },
  { code: "+213", flag: "🇩🇿", label: "Algérie"       },
  { code: "+44",  flag: "🇬🇧", label: "Royaume-Uni"   },
  { code: "+49",  flag: "🇩🇪", label: "Allemagne"     },
  { code: "+34",  flag: "🇪🇸", label: "Espagne"       },
  { code: "+39",  flag: "🇮🇹", label: "Italie"        },
];

// ─── Formations data ──────────────────────────────────────────────────────────
const FORMATIONS = [
  {
    id:        "potager",
    emoji:     "🌱",
    titre:     "Formation Potager Maison",
    sousTitre: "Pour débutant — 2 jours en ligne",
    formateur: "Mandiaye Diallo",
    prix:      15,
    prixFCFA:  "10 000 FCFA",
    mention:   "Formation potager",
    couleur:   "#166534",
    bg:        "#f0fdf4",
    border:    "#d1fae5",
    programme: [
      {
        jour: "Jour 1",
        items: [
          "Introduction & présentation",
          "Comprendre la biodiversité",
          "Le design du potager maison",
          "Le sol vivant",
          "Semer et planter",
          "Discussions — Questions / Réponses",
        ],
      },
      {
        jour: "Jour 2",
        items: [
          "Le potager en pot et les carrés hors sol",
          "Serre maison",
          "Lutte contre les maladies et nuisibles",
          "Astuces pratiques (pollinisation, arrosage...)",
          "Discussions — Questions / Réponses",
        ],
      },
    ],
  },
  {
    id:        "maraichage",
    emoji:     "🌿",
    titre:     "Formation Maraîchage BIO",
    sousTitre: "Professionnel — 2 jours en ligne",
    formateur: "Sébastien (professeur université agricole)",
    prix:      45,
    prixFCFA:  "30 000 FCFA",
    mention:   "Formation maraîchage",
    couleur:   "#1e40af",
    bg:        "#eff6ff",
    border:    "#bfdbfe",
    programme: [
      {
        jour: "Jour 1",
        items: [
          "Historique du maraîchage BIO",
          "Installation : aspects financiers",
          "Matériel & coûts (cas de la France)",
          "Aides possibles (cas de la France)",
          "Moyens et systèmes de production",
          "Étude du territoire & accès au foncier",
          "Commercialisation : où, comment, à quel prix",
          "Définir ses objectifs & accès à l'eau",
        ],
      },
      {
        jour: "Jour 2",
        items: [
          "Analyse simple du sol",
          "Techniques de semis & plantation",
          "Pépinière & gestion de la serre",
          "Planning de culture & rotation des cultures",
          "Organisation du travail au quotidien",
          "Irrigation : matériel, systèmes & coûts",
        ],
      },
    ],
  },
];

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  green:      "#1f7a3d",
  greenDark:  "#166534",
  greenLight: "#f0fdf4",
  greenBorder:"#d1fae5",
  amber:      "#92400e",
  amberLight: "#fef3c7",
  gray:       "#4b5563",
  border:     "#e5e7eb",
  white:      "#fff",
  bg:         "#f4f8f1",
  bgAlt:      "#f0fdf4",
};

const card = {
  background: T.white,
  borderRadius: 16,
  boxShadow: "0 4px 18px rgba(0,0,0,0.06)",
  padding: 24,
  border: `1px solid ${T.border}`,
};

// ─── Envoi inscription vers Google Sheets ─────────────────────────────────────
async function sendInscriptionToSheets(payload) {
  if (!SHEETS_WEBHOOK_URL || SHEETS_WEBHOOK_URL === "COLLE_TON_URL_ICI") return;
  try {
    const encoded = encodeURIComponent(JSON.stringify({ type: "inscription", ...payload }));
    const url     = `${SHEETS_WEBHOOK_URL}?data=${encoded}`;
    await new Promise((resolve) => {
      const img = new Image();
      img.onload = resolve;
      img.onerror = resolve;
      img.src = url;
    });
    console.log("✅ Inscription envoyée vers Google Sheets");
  } catch (err) {
    console.warn("Sheets inscription error:", err);
  }
}

// ─── Modal paiement ───────────────────────────────────────────────────────────
function PaymentModal({ formation, customer, fullPhone, onClose, onPaymentChosen }) {
  const [selected, setSelected] = useState(null);
  const [copied,   setCopied]   = useState(false);
  const amount    = formation.prix;
  const paypalUrl = `https://www.paypal.com/paypalme/${PAYPAL_EMAIL.split("@")[0]}/${amount}EUR`;

  const copyWero = () => {
    navigator.clipboard.writeText(WERO_NUMBER.replace(/\s/g, "")).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2500);
    });
  };

  const methods = [
    {
      id: "PayPal", label: "PayPal", color: "#003087", bg: "#e8f0fe", icon: "🅿️",
      desc: "Paiement en ligne automatique — montant pré-rempli",
      content: (
        <>
          <div style={{ fontSize: 13, color: T.gray, marginBottom: 10 }}>Vers : {PAYPAL_EMAIL}</div>
          <a href={paypalUrl} target="_blank" rel="noreferrer" style={{ textDecoration: "none", display: "block" }} onClick={() => onPaymentChosen("PayPal")}>
            <button type="button" style={{ border: "none", background: "#003087", color: T.white, borderRadius: 10, padding: "13px", fontWeight: "bold", cursor: "pointer", width: "100%", fontSize: 15 }}>
              Payer {amount} € avec PayPal →
            </button>
          </a>
          <div style={{ fontSize: 12, color: "#9ca3af", textAlign: "center", marginTop: 8 }}>Montant pré-rempli automatiquement.</div>
        </>
      ),
    },
    {
      id: "Wero", label: "Wero", color: "#5b21b6", bg: "#f5f3ff", icon: "💜",
      desc: "Paiement manuel — envoyez via votre app Wero",
      content: (
        <>
          <div style={{ fontSize: 13, color: T.gray, marginBottom: 12 }}>
            Ouvrez votre app Wero et envoyez <strong>{amount} €</strong> au numéro ci-dessous :
          </div>
          <div style={{ background: "#5b21b6", borderRadius: 14, padding: "18px 20px", textAlign: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", marginBottom: 6, letterSpacing: 1 }}>NUMÉRO WERO</div>
            <div style={{ fontSize: 28, fontWeight: "bold", color: T.white, letterSpacing: 3, fontFamily: "monospace" }}>{WERO_NUMBER}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 6 }}>La Serre Africaine</div>
          </div>
          <button type="button" onClick={() => { copyWero(); onPaymentChosen("Wero"); }}
            style={{ border: "2px solid #5b21b6", background: copied ? "#5b21b6" : T.white, color: copied ? T.white : "#5b21b6", borderRadius: 10, padding: "11px", fontWeight: "bold", cursor: "pointer", width: "100%", fontSize: 14, transition: "all 0.2s" }}>
            {copied ? "✓ Numéro copié !" : "📋 Copier le numéro"}
          </button>
        </>
      ),
    },
    {
      id: "Wave", label: "Wave (Sénégal)", color: "#0369a1", bg: "#e0f2fe", icon: "📱",
      desc: "Pour les inscrits au Sénégal",
      content: (
        <div style={{ background: T.white, border: "1px solid #bae6fd", borderRadius: 10, padding: 14, fontSize: 13 }}>
          <div style={{ fontWeight: "bold", color: "#0369a1", marginBottom: 10 }}>Numéro Wave :</div>
          <div style={{ fontSize: 24, fontWeight: "bold", letterSpacing: 2, color: "#0369a1", fontFamily: "monospace", textAlign: "center", padding: "14px", background: "#e0f2fe", borderRadius: 10, marginBottom: 10 }}>
            {WAVE_NUMBER}
          </div>
          <div style={{ color: T.gray, fontSize: 12 }}>Montant : <strong>{formation.prixFCFA}</strong></div>
          <button type="button" onClick={() => onPaymentChosen("Wave")}
            style={{ border: "none", background: "#0369a1", color: T.white, borderRadius: 10, padding: "11px", fontWeight: "bold", cursor: "pointer", width: "100%", fontSize: 14, marginTop: 12 }}>
            J'ai effectué le paiement Wave ✓
          </button>
        </div>
      ),
    },
    {
      id: "Virement", label: "Virement bancaire", color: T.green, bg: T.greenLight, icon: "🏦",
      desc: "Virement SEPA classique",
      content: (
        <div style={{ background: T.white, border: `1px solid ${T.greenBorder}`, borderRadius: 10, padding: 14, fontSize: 13 }}>
          <div style={{ fontWeight: "bold", color: T.greenDark, marginBottom: 10 }}>Coordonnées bancaires :</div>
          {[
            ["Bénéficiaire", "La Serre Africaine"],
            ["IBAN", "FR76 XXXX XXXX XXXX XXXX XXXX XXX"],
            ["Référence", `${formation.mention} — ${customer?.prenom} ${customer?.nom}`],
            ["Montant", `${amount} €`],
          ].map(([l, v]) => (
            <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #f0fdf4" }}>
              <span style={{ color: T.gray }}>{l}</span>
              <strong style={{ fontFamily: l === "IBAN" ? "monospace" : undefined, fontSize: l === "IBAN" ? 12 : undefined }}>{v}</strong>
            </div>
          ))}
          <div style={{ background: "#fff7ed", color: "#9a3412", borderRadius: 8, padding: 8, marginTop: 10, fontSize: 12 }}>
            ⚠️ Remplace l'IBAN par le tien dans Formations.jsx
          </div>
          <button type="button" onClick={() => onPaymentChosen("Virement")}
            style={{ border: "none", background: T.green, color: T.white, borderRadius: 10, padding: "11px", fontWeight: "bold", cursor: "pointer", width: "100%", fontSize: 14, marginTop: 12 }}>
            J'ai noté les coordonnées ✓
          </button>
        </div>
      ),
    },
  ];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }} onClick={onClose} />
      <div style={{ position: "relative", background: T.white, borderRadius: "20px 20px 0 0", padding: 24, width: "100%", maxWidth: 520, maxHeight: "92vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <h2 style={{ margin: 0, color: T.greenDark, fontSize: 20 }}>💳 Choisir le paiement</h2>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: T.gray }}>✕</button>
        </div>
        <div style={{ background: T.greenLight, borderRadius: 10, padding: "10px 14px", marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: T.greenDark, fontWeight: "bold" }}>{formation.emoji} {formation.titre}</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
            <span style={{ color: T.gray, fontSize: 13 }}>Total à régler</span>
            <span style={{ color: T.greenDark, fontWeight: "bold", fontSize: 22 }}>{amount} €</span>
          </div>
        </div>
        <div style={{ background: T.amberLight, border: "1px solid #fcd34d", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: T.amber }}>
          ⚠️ <strong>Important :</strong> indiquez <strong>"{formation.mention}"</strong> dans le sujet de votre paiement.
        </div>
        <div style={{ display: "grid", gap: 10, marginBottom: 16 }}>
          {methods.map((m) => (
            <div key={m.id} onClick={() => setSelected(selected === m.id ? null : m.id)}
              style={{ border: selected === m.id ? `2px solid ${m.color}` : `1px solid ${T.border}`, borderRadius: 14, padding: 16, cursor: "pointer", background: selected === m.id ? m.bg : T.white, transition: "all 0.2s" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: selected === m.id ? 14 : 0 }}>
                <span style={{ fontSize: 22 }}>{m.icon}</span>
                <div>
                  <div style={{ fontWeight: "bold", color: m.color, fontSize: 15 }}>{m.label}</div>
                  <div style={{ fontSize: 12, color: T.gray }}>{m.desc}</div>
                </div>
                <div style={{ marginLeft: "auto", width: 20, height: 20, borderRadius: "50%", border: `2px solid ${selected === m.id ? m.color : "#d1d5db"}`, background: selected === m.id ? m.color : T.white, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {selected === m.id && <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.white }} />}
                </div>
              </div>
              {selected === m.id && m.content}
            </div>
          ))}
        </div>
        <div style={{ background: T.greenLight, border: `1px solid ${T.greenBorder}`, borderRadius: 10, padding: 12, fontSize: 13, color: T.greenDark }}>
          <strong>Après paiement :</strong> confirmation sous 48h. En cas de doute, écrivez sur WhatsApp au +33 6 03 90 89 35.
        </div>
      </div>
    </div>
  );
}

// ─── Confirmation page inscription ────────────────────────────────────────────
function ConfirmationInscription({ formation, customer, fullPhone, email, onBack }) {
  const [showPayment,   setShowPayment]   = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [sheetSent,     setSheetSent]     = useState(false);

  const waMsg = encodeURIComponent(
    `Bonjour Mandiaye,\n\nJe souhaite m'inscrire à la formation :\n${formation.emoji} ${formation.titre}\n\nMon profil :\nNom : ${customer.prenom} ${customer.nom}\nEmail : ${email}\nTéléphone : ${fullPhone}\nPays : ${customer.pays}\n\nMontant : ${formation.prix} € (${formation.prixFCFA})\nMention paiement : "${formation.mention}"\n\nMerci !`
  );
  const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${waMsg}`;

  const handleWAClick = useCallback(async () => {
    if (sheetSent) return;
    const payload = {
      formation:     formation.titre,
      formationId:   formation.id,
      nom:           customer.nom,
      prenom:        customer.prenom,
      email,
      fullPhone,
      pays:          customer.pays,
      prix:          formation.prix,
      prixFCFA:      formation.prixFCFA,
      paymentMethod: paymentMethod || "Non renseigné",
    };
    await sendInscriptionToSheets(payload);
    setSheetSent(true);
  }, [sheetSent, formation, customer, email, fullPhone, paymentMethod]);

  return (
    <div style={{ background: T.bg, minHeight: "100vh" }}>
      {showPayment && (
        <PaymentModal
          formation={formation}
          customer={customer}
          fullPhone={fullPhone}
          onClose={() => setShowPayment(false)}
          onPaymentChosen={(m) => { setPaymentMethod(m); setShowPayment(false); }}
        />
      )}

      <div style={{ background: T.green, color: T.white, padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
        <button type="button" onClick={onBack} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: T.white, borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontWeight: "bold", fontSize: 13 }}>← Retour</button>
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: "bold" }}>Confirmation d'inscription</h1>
      </div>

      <div style={{ maxWidth: 600, margin: "0 auto", padding: "24px 16px" }}>
        <div style={{ ...card, marginBottom: 20, textAlign: "center" }}>
          <div style={{ fontSize: 52, marginBottom: 10 }}>✅</div>
          <h2 style={{ color: T.greenDark, margin: "0 0 8px", fontSize: 22 }}>Inscription préparée !</h2>
          <p style={{ color: T.gray, fontSize: 14, margin: "0 0 16px" }}>Confirmez sur WhatsApp puis procédez au paiement pour valider votre place.</p>
          {paymentMethod && (
            <div style={{ background: T.greenLight, border: `1px solid ${T.greenBorder}`, borderRadius: 8, padding: "8px 12px", fontSize: 13, color: T.greenDark, fontWeight: "bold" }}>
              💳 Mode de paiement choisi : {paymentMethod}
            </div>
          )}
        </div>

        <div style={{ ...card, marginBottom: 16, background: formation.bg, border: `2px solid ${formation.border}` }}>
          <h3 style={{ color: formation.couleur, margin: "0 0 14px", fontSize: 17 }}>{formation.emoji} {formation.titre}</h3>
          <div style={{ fontSize: 14, color: T.gray, marginBottom: 6 }}>👨‍🏫 Formateur : <strong>{formation.formateur}</strong></div>
          <div style={{ fontSize: 14, color: T.gray, marginBottom: 6 }}>📅 Dates : <strong>Prochaines dates à annoncer</strong></div>
          <div style={{ fontSize: 14, color: T.gray, marginBottom: 6 }}>⏰ Horaires : <strong>20h GMT → 22h GMT</strong></div>
          <div style={{ fontSize: 20, fontWeight: "bold", color: formation.couleur, marginTop: 10 }}>
            {formation.prix} € <span style={{ fontSize: 14, color: T.gray }}>/ {formation.prixFCFA}</span>
          </div>
        </div>

        <div style={{ ...card, marginBottom: 16 }}>
          <h3 style={{ color: T.greenDark, margin: "0 0 14px", fontSize: 17 }}>👤 Vos informations</h3>
          {[
            ["Nom",       `${customer.prenom} ${customer.nom}`],
            ["Email",     email],
            ["Téléphone", fullPhone],
            ["Pays",      customer.pays],
          ].map(([l, v]) => (
            <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${T.border}`, fontSize: 14 }}>
              <span style={{ color: T.gray }}>{l}</span><span style={{ fontWeight: "bold" }}>{v}</span>
            </div>
          ))}
        </div>

        <div style={{ ...card, marginBottom: 20, background: T.amberLight, border: "1px solid #fcd34d" }}>
          <h3 style={{ color: T.amber, margin: "0 0 10px", fontSize: 15 }}>⚠️ Mention obligatoire dans votre paiement :</h3>
          <div style={{ background: T.white, borderRadius: 8, padding: "10px 14px", fontFamily: "monospace", fontSize: 16, fontWeight: "bold", color: T.amber, textAlign: "center" }}>
            "{formation.mention}"
          </div>
        </div>

        <div style={{ ...card, marginBottom: 20 }}>
          <h3 style={{ color: T.greenDark, margin: "0 0 16px", fontSize: 17 }}>📋 Prochaines étapes</h3>
          {[
            { num: "1", title: "Confirmer sur WhatsApp",  desc: "Votre inscription est enregistrée dans notre tableau de suivi.", color: T.greenLight },
            { num: "2", title: "Régler votre inscription", desc: "Choisissez votre mode de paiement et indiquez la mention obligatoire.", color: "#e0f2fe" },
            { num: "3", title: "Confirmation sous 48h",   desc: "Vous recevrez un email/SMS de confirmation de votre place.", color: T.amberLight },
            { num: "4", title: "Lien de session",         desc: "Le lien d'accès vous sera envoyé une semaine avant la formation.", color: "#f3e8ff" },
          ].map((step) => (
            <div key={step.num} style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 14 }}>
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: step.color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", color: T.greenDark, flexShrink: 0, fontSize: 15 }}>{step.num}</div>
              <div><div style={{ fontWeight: "bold", fontSize: 14, marginBottom: 2 }}>{step.title}</div><div style={{ color: T.gray, fontSize: 13 }}>{step.desc}</div></div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gap: 12 }}>
          <a href={waUrl} target="_blank" rel="noreferrer" onClick={handleWAClick}>
            <button type="button" style={{ background: "#25D366", color: T.white, border: "none", borderRadius: 14, padding: "16px", fontSize: 16, fontWeight: "bold", cursor: "pointer", width: "100%", boxShadow: "0 6px 18px rgba(37,211,102,0.28)" }}>
              1️⃣ Confirmer sur WhatsApp
              {sheetSent && <span style={{ fontSize: 12, opacity: 0.85, marginLeft: 8 }}>✓ enregistré</span>}
            </button>
          </a>
          <button type="button" onClick={() => setShowPayment(true)}
            style={{ background: T.green, color: T.white, border: "none", borderRadius: 14, padding: "16px", fontSize: 16, fontWeight: "bold", cursor: "pointer", width: "100%", boxShadow: "0 6px 18px rgba(31,122,61,0.22)" }}>
            2️⃣ Payer mon inscription ({formation.prix} €)
            {paymentMethod && <span style={{ fontSize: 13, opacity: 0.85, marginLeft: 8 }}>— {paymentMethod}</span>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Validated input ──────────────────────────────────────────────────────────
function ValidatedInput({ placeholder, value, onChange, validate, type = "text" }) {
  const [touched, setTouched] = useState(false);
  const isValid = touched ? validate(value) : null;
  const borderColor = isValid === null ? "#cbd5e1" : isValid ? "#22c55e" : "#ef4444";
  return (
    <div style={{ position: "relative" }}>
      <input type={type} placeholder={placeholder} value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => setTouched(true)}
        style={{ padding: "11px 36px 11px 12px", fontSize: 14, borderRadius: 8, border: `1.5px solid ${borderColor}`, width: "100%", background: T.white, boxSizing: "border-box", transition: "border-color 0.2s" }} />
      {isValid !== null && (
        <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: isValid ? "#22c55e" : "#ef4444", fontSize: 16, fontWeight: "bold" }}>
          {isValid ? "✓" : "✗"}
        </span>
      )}
    </div>
  );
}

// ─── Carte formation ──────────────────────────────────────────────────────────
function FormationCard({ formation, onSelect }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={{ ...card, border: `2px solid ${formation.border}`, background: formation.bg, position: "relative" }}>
      <div style={{ marginBottom: 14 }}>
        <h2 style={{ margin: "0 0 4px", color: formation.couleur, fontSize: 22, fontWeight: "bold" }}>
          {formation.emoji} {formation.titre}
        </h2>
        <p style={{ margin: "0 0 8px", color: T.gray, fontSize: 14, fontWeight: "bold" }}>{formation.sousTitre}</p>
        <div style={{ fontSize: 13, color: T.gray }}>👨‍🏫 <strong>{formation.formateur}</strong></div>
      </div>

      {/* Info dates/horaires */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
        <div style={{ background: T.white, border: `1px solid ${formation.border}`, borderRadius: 8, padding: "8px 12px", fontSize: 13 }}>
          📅 <strong>Prochaines dates à annoncer</strong>
        </div>
        <div style={{ background: T.white, border: `1px solid ${formation.border}`, borderRadius: 8, padding: "8px 12px", fontSize: 13 }}>
          ⏰ <strong>20h GMT → 22h GMT</strong>
        </div>
        <div style={{ background: T.white, border: `1px solid ${formation.border}`, borderRadius: 8, padding: "8px 12px", fontSize: 13 }}>
          🌐 <strong>En ligne · En français</strong>
        </div>
      </div>

      {/* Prix */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
        <span style={{ fontSize: 32, fontWeight: "bold", color: formation.couleur }}>{formation.prix} €</span>
        <div>
          <div style={{ fontSize: 13, color: T.gray }}>ou {formation.prixFCFA}</div>
          <div style={{ fontSize: 12, color: T.gray }}>2 jours + documents inclus</div>
        </div>
      </div>

      {/* Programme accordéon */}
      <button type="button" onClick={() => setExpanded(!expanded)}
        style={{ background: "none", border: `1px solid ${formation.border}`, borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontSize: 13, color: formation.couleur, fontWeight: "bold", marginBottom: 14, width: "100%" }}>
        {expanded ? "▲ Masquer le programme" : "▼ Voir le programme complet"}
      </button>

      {expanded && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 16 }}>
          {formation.programme.map((jour) => (
            <div key={jour.jour} style={{ background: T.white, borderRadius: 10, padding: 14, border: `1px solid ${formation.border}` }}>
              <div style={{ fontWeight: "bold", color: formation.couleur, marginBottom: 8, fontSize: 14 }}>📌 {jour.jour}</div>
              {jour.items.map((item) => (
                <div key={item} style={{ display: "flex", gap: 8, fontSize: 13, color: T.gray, marginBottom: 5 }}>
                  <span style={{ color: formation.couleur, flexShrink: 0 }}>✓</span>{item}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      <button type="button" onClick={() => onSelect(formation)}
        style={{ border: "none", background: formation.couleur, color: T.white, borderRadius: 12, padding: "14px 20px", fontWeight: "bold", cursor: "pointer", width: "100%", fontSize: 16, boxShadow: `0 6px 18px ${formation.couleur}40` }}>
        Je m'inscris à cette formation →
      </button>
    </div>
  );
}

// ─── Formulaire inscription ───────────────────────────────────────────────────
function FormulaireInscription({ formation, onBack, onConfirm }) {
  const [customer,     setCustomer]     = useState({ nom: "", prenom: "", pays: "France" });
  const [email,        setEmail]        = useState("");
  const [countryCode,  setCountryCode]  = useState("+33");
  const [phoneNumber,  setPhoneNumber]  = useState("");

  const fullPhone = `${countryCode} ${phoneNumber}`;

  const isValid = customer.nom.trim().length >= 2 &&
    customer.prenom.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
    phoneNumber.replace(/\D/g, "").length >= 7;

  return (
    <div style={{ background: T.bg, minHeight: "100vh" }}>
      <div style={{ background: T.green, color: T.white, padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
        <button type="button" onClick={onBack} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: T.white, borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontWeight: "bold", fontSize: 13 }}>← Retour</button>
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: "bold" }}>Inscription — {formation.titre}</h1>
      </div>
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "24px 16px" }}>
        <div style={{ ...card, background: formation.bg, border: `2px solid ${formation.border}`, marginBottom: 20, textAlign: "center" }}>
          <div style={{ fontSize: 36 }}>{formation.emoji}</div>
          <h2 style={{ color: formation.couleur, margin: "8px 0 4px" }}>{formation.titre}</h2>
          <div style={{ fontSize: 22, fontWeight: "bold", color: formation.couleur }}>{formation.prix} € <span style={{ fontSize: 14, color: T.gray }}>/ {formation.prixFCFA}</span></div>
        </div>

        <div style={card}>
          <h3 style={{ color: T.greenDark, margin: "0 0 16px" }}>📋 Vos informations</h3>
          <div style={{ display: "grid", gap: 12 }}>
            <ValidatedInput placeholder="Prénom" value={customer.prenom} onChange={(v) => setCustomer(p => ({ ...p, prenom: v }))} validate={(v) => v.trim().length >= 2} />
            <ValidatedInput placeholder="Nom" value={customer.nom} onChange={(v) => setCustomer(p => ({ ...p, nom: v }))} validate={(v) => v.trim().length >= 2} />
            <ValidatedInput placeholder="Email" type="email" value={email} onChange={setEmail} validate={(v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)} />
            <ValidatedInput placeholder="Pays" value={customer.pays} onChange={(v) => setCustomer(p => ({ ...p, pays: v }))} validate={(v) => v.trim().length >= 2} />

            {/* Téléphone */}
            <div style={{ display: "flex", gap: 8 }}>
              <select value={countryCode} onChange={(e) => setCountryCode(e.target.value)}
                style={{ padding: "11px 8px", fontSize: 14, borderRadius: 8, border: "1.5px solid #cbd5e1", background: T.white, flexShrink: 0, width: 130 }}>
                {COUNTRY_CODES.map((c) => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
              </select>
              <input type="tel" placeholder="Numéro (sans le 0 initial)" value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                style={{ padding: "11px 12px", fontSize: 14, borderRadius: 8, border: "1.5px solid #cbd5e1", flex: 1, background: T.white }} />
            </div>

            {phoneNumber && (
              <div style={{ fontSize: 13, color: T.greenDark, fontWeight: "bold" }}>📞 Numéro complet : {fullPhone}</div>
            )}
          </div>

          <div style={{ background: T.amberLight, border: "1px solid #fcd34d", borderRadius: 10, padding: "10px 14px", marginTop: 16, fontSize: 13, color: T.amber }}>
            ⚠️ N'oubliez pas d'indiquer <strong>"{formation.mention}"</strong> dans le sujet de votre paiement.
          </div>

          <button type="button"
            onClick={() => isValid && onConfirm(formation, customer, fullPhone, email)}
            style={{ border: "none", background: isValid ? formation.couleur : "#d1d5db", color: T.white, borderRadius: 12, padding: "15px 16px", fontSize: 15, fontWeight: "bold", cursor: isValid ? "pointer" : "not-allowed", width: "100%", marginTop: 16, boxShadow: isValid ? `0 6px 18px ${formation.couleur}30` : "none" }}>
            Voir le récapitulatif →
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page principale Formations ───────────────────────────────────────────────
export default function Formations({ onNavigateBoutique }) {
  const [step,          setStep]          = useState("liste"); // liste | formulaire | confirmation
  const [selectedForm,  setSelectedForm]  = useState(null);
  const [customer,      setCustomer]      = useState(null);
  const [fullPhone,     setFullPhone]     = useState("");
  const [email,         setEmail]         = useState("");

  const handleSelectFormation = (formation) => {
    setSelectedForm(formation);
    setStep("formulaire");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleConfirm = (formation, cust, phone, mail) => {
    setCustomer(cust);
    setFullPhone(phone);
    setEmail(mail);
    setStep("confirmation");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (step === "formulaire") {
    return <FormulaireInscription formation={selectedForm} onBack={() => setStep("liste")} onConfirm={handleConfirm} />;
  }

  if (step === "confirmation") {
    return <ConfirmationInscription formation={selectedForm} customer={customer} fullPhone={fullPhone} email={email} onBack={() => setStep("formulaire")} />;
  }

  // ── Page liste ──
  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; font-family: 'Segoe UI', Arial, sans-serif; background: ${T.bg}; color: #1f2937; }
        button:hover { opacity: 0.9; } button:active { transform: scale(0.97); }
      `}</style>

      {/* Header */}
      <header style={{ background: T.green, color: T.white, padding: "15px 16px", position: "sticky", top: 0, zIndex: 30, boxShadow: "0 2px 12px rgba(0,0,0,0.15)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: "bold", letterSpacing: "-0.3px" }}>LA SERRE AFRICAINE</h1>
            <p style={{ margin: 0, opacity: 0.85, fontSize: 12 }}>Formations Potager & Maraîchage BIO 🌱</p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button type="button" onClick={onNavigateBoutique}
              style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", color: T.white, borderRadius: 999, padding: "10px 18px", fontWeight: "bold", cursor: "pointer", fontSize: 13 }}>
              🛒 Boutique
            </button>
            <div style={{ background: T.white, color: T.greenDark, borderRadius: 999, padding: "10px 18px", fontWeight: "bold", fontSize: 13 }}>
              📚 Formations
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section style={{ background: `linear-gradient(135deg, ${T.green}, #2f9e44)`, color: T.white, padding: "40px 16px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontSize: 11, fontWeight: "bold", letterSpacing: 2, opacity: 0.75, marginBottom: 12, textTransform: "uppercase" }}>Formations en ligne · En français</div>
          <h2 style={{ margin: "0 0 16px", fontSize: 36, lineHeight: 1.1, fontWeight: "bold" }}>🌱 Formations Potager & Maraîchage BIO</h2>
          <p style={{ fontSize: 16, lineHeight: 1.8, marginBottom: 24, opacity: 0.95, maxWidth: 640, margin: "0 auto 24px" }}>
            Tout ce que je partage vient du terrain. De la terre. Des mains sales, des essais ratés, des réussites qui donnent le sourire.
            Depuis le jour où j'ai goûté mes premières carottes cultivées à quelques mètres de la maison — <strong>la terre m'a changé.</strong>
          </p>
          <p style={{ fontSize: 15, lineHeight: 1.7, opacity: 0.9, maxWidth: 600, margin: "0 auto 28px" }}>
            Aujourd'hui, j'ai envie de transmettre ce changement — avec simplicité, vérité et pratique.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            {["🌍 Accessible partout dans le monde", "🇫🇷 En français", "📱 En ligne (Zoom/Meet)", "📄 Documents inclus"].map((r) => (
              <div key={r} style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 999, padding: "8px 16px", fontSize: 13, fontWeight: "bold" }}>{r}</div>
            ))}
          </div>
        </div>
      </section>

      {/* Formateurs */}
      <section style={{ background: T.white, borderBottom: `1px solid ${T.border}`, padding: "24px 16px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <h3 style={{ color: T.greenDark, textAlign: "center", margin: "0 0 16px", fontSize: 18 }}>👨‍🏫 Vos formateurs</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
            {[
              { emoji: "🌱", nom: "Mandiaye Diallo", role: "Formation Potager Maison", desc: "Fondateur de La Serre Africaine. Passionné de jardinage et de cultures africaines en France. Il partage son expérience du terrain avec authenticité." },
              { emoji: "🌿", nom: "Sébastien",       role: "Formation Maraîchage BIO", desc: "Professionnel du BIO, professeur en université agricole. Passionné et exigeant, il vous accompagne avec rigueur sur le maraîchage professionnel." },
            ].map((f) => (
              <div key={f.nom} style={{ background: T.greenLight, borderRadius: 12, padding: 16, border: `1px solid ${T.greenBorder}` }}>
                <div style={{ fontSize: 30, marginBottom: 8 }}>{f.emoji}</div>
                <div style={{ fontWeight: "bold", fontSize: 16, color: T.greenDark }}>{f.nom}</div>
                <div style={{ fontSize: 13, color: T.green, fontWeight: "bold", marginBottom: 6 }}>{f.role}</div>
                <div style={{ fontSize: 13, color: T.gray, lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Formations */}
      <section style={{ padding: "32px 16px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <h2 style={{ color: T.greenDark, textAlign: "center", margin: "0 0 8px", fontSize: 28, fontWeight: "bold" }}>Nos formations</h2>
          <p style={{ color: T.gray, textAlign: "center", margin: "0 0 28px", fontSize: 15 }}>2 jours de formation intensive + documents inclus</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 24 }}>
            {FORMATIONS.map((f) => (
              <FormationCard key={f.id} formation={f} onSelect={handleSelectFormation} />
            ))}
          </div>

          {/* Pack duo */}
          <div style={{ marginTop: 24, background: "linear-gradient(135deg, #1f7a3d, #1e40af)", borderRadius: 18, padding: 28, color: T.white, textAlign: "center" }}>
            <h3 style={{ margin: "0 0 8px", fontSize: 22 }}>🎓 Pack Duo — Les 2 formations</h3>
            <p style={{ opacity: 0.9, margin: "0 0 16px", fontSize: 15 }}>Potager Maison + Maraîchage BIO — 4 jours complets</p>
            <div style={{ fontSize: 32, fontWeight: "bold", marginBottom: 8 }}>
              60 € <span style={{ fontSize: 16, opacity: 0.8 }}>au lieu de 60 €</span>
            </div>
            <div style={{ fontSize: 14, opacity: 0.8, marginBottom: 20 }}>40 000 FCFA</div>
            <div style={{ background: T.amberLight, color: T.amber, borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: "bold", display: "inline-block", marginBottom: 16 }}>
              Mention paiement : "Formations potager et maraîchage"
            </div>
            <br />
            <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Bonjour Mandiaye,\n\nJe souhaite m'inscrire au Pack Duo (Potager Maison + Maraîchage BIO).\nMontant : 60 €\n\nMerci !")}`}
              target="_blank" rel="noreferrer">
              <button type="button" style={{ background: "#25D366", color: T.white, border: "none", borderRadius: 999, padding: "14px 28px", fontWeight: "bold", cursor: "pointer", fontSize: 15 }}>
                💬 S'inscrire au Pack Duo sur WhatsApp
              </button>
            </a>
          </div>
        </div>
      </section>

      {/* Paiement */}
      <section style={{ background: T.white, padding: "32px 16px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <h2 style={{ color: T.greenDark, textAlign: "center", margin: "0 0 20px", fontSize: 24, fontWeight: "bold" }}>💳 Modes de paiement acceptés</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 20 }}>
            {[
              { icon: "🅿️", label: "PayPal",       desc: "Lien automatique",       color: "#003087", bg: "#e8f0fe" },
              { icon: "💜", label: "Wero",          desc: "Numéro à copier",        color: "#5b21b6", bg: "#f5f3ff" },
              { icon: "📱", label: "Wave Sénégal",  desc: "+221 77 181 33 44",      color: "#0369a1", bg: "#e0f2fe" },
              { icon: "🏦", label: "Virement SEPA", desc: "Coordonnées bancaires",  color: T.green,   bg: T.greenLight },
            ].map((m) => (
              <div key={m.label} style={{ border: `1px solid ${T.border}`, borderRadius: 12, padding: 14, textAlign: "center", background: m.bg }}>
                <div style={{ fontSize: 26, marginBottom: 6 }}>{m.icon}</div>
                <div style={{ fontWeight: "bold", color: m.color, fontSize: 14 }}>{m.label}</div>
                <div style={{ fontSize: 11, color: T.gray, marginTop: 3 }}>{m.desc}</div>
              </div>
            ))}
          </div>
          <div style={{ background: T.amberLight, border: "1px solid #fcd34d", borderRadius: 12, padding: 16, textAlign: "center" }}>
            <div style={{ fontWeight: "bold", color: T.amber, marginBottom: 6, fontSize: 15 }}>⚠️ Mention obligatoire dans votre paiement</div>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
              {["Formation potager", "Formation maraîchage", "Formations potager et maraîchage"].map((m) => (
                <span key={m} style={{ background: T.white, border: "1px solid #fcd34d", borderRadius: 8, padding: "4px 10px", fontFamily: "monospace", fontSize: 13, color: T.amber, fontWeight: "bold" }}>"{m}"</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: "32px 16px", background: T.bgAlt }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <h2 style={{ color: T.greenDark, textAlign: "center", margin: "0 0 20px", fontSize: 24, fontWeight: "bold" }}>❓ Questions fréquentes</h2>
          {[
            { q: "Les formations sont-elles en présentiel ou en ligne ?", r: "Entièrement en ligne (Zoom ou Google Meet). Vous pouvez participer depuis n'importe quel pays." },
            { q: "Est-ce que je reçois des documents ?", r: "Oui ! Des supports de formation sont inclus dans le prix et vous seront envoyés avant le début de la formation." },
            { q: "Quand seront annoncées les prochaines dates ?", r: "Les dates seront publiées prochainement. Inscrivez-vous maintenant pour réserver votre place, et vous serez informé dès l'annonce." },
            { q: "Que faire si mon mode de paiement ne convient pas ?", r: "Écrivez directement sur WhatsApp au +33 6 03 90 89 35, Mandiaye trouvera une solution avec vous." },
            { q: "Puis-je m'inscrire aux deux formations ?", r: "Oui ! Le Pack Duo (60 €) vous donne accès aux deux formations. Indiquez \"Formations potager et maraîchage\" dans votre paiement." },
          ].map((faq, i) => (
            <div key={i} style={{ background: T.white, borderRadius: 12, padding: 16, marginBottom: 10, border: `1px solid ${T.border}` }}>
              <div style={{ fontWeight: "bold", color: T.greenDark, marginBottom: 6, fontSize: 14 }}>❓ {faq.q}</div>
              <div style={{ color: T.gray, fontSize: 14, lineHeight: 1.6 }}>{faq.r}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section style={{ background: `linear-gradient(135deg, ${T.green}, #2f9e44)`, color: T.white, padding: "32px 16px", textAlign: "center" }}>
        <h2 style={{ margin: "0 0 12px", fontSize: 26 }}>Une question ?</h2>
        <p style={{ opacity: 0.9, margin: "0 0 20px", fontSize: 15 }}>Mandiaye est disponible pour vous répondre.</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
            <button type="button" style={{ background: "#25D366", color: T.white, border: "none", borderRadius: 999, padding: "12px 22px", fontWeight: "bold", cursor: "pointer", fontSize: 14 }}>
              💬 WhatsApp : +33 6 03 90 89 35
            </button>
          </a>
          <a href="mailto:monpotagermaison@gmail.com" style={{ textDecoration: "none" }}>
            <button type="button" style={{ background: "rgba(255,255,255,0.15)", color: T.white, border: "1px solid rgba(255,255,255,0.3)", borderRadius: 999, padding: "12px 22px", fontWeight: "bold", cursor: "pointer", fontSize: 14 }}>
              ✉️ monpotagermaison@gmail.com
            </button>
          </a>
        </div>
        <p style={{ opacity: 0.7, marginTop: 16, fontSize: 13 }}>Je serai là pour t'accompagner, répondre à tes questions, et partager ce que la terre m'a appris — sincèrement, simplement, INSHALLAH. 🌿</p>
      </section>

      <footer style={{ textAlign: "center", color: T.gray, padding: "20px 16px", fontSize: 13, background: T.white }}>
        La Serre Africaine · Formations Potager & Maraîchage BIO · <strong>monpotagermaison@gmail.com</strong>
      </footer>
    </>
  );
}
