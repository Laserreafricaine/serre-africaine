import React, { useMemo, useState, useCallback, useRef, useEffect } from "react";
import Formations from "./Formations";

// ─── SEO — colle ceci dans ton index.html <head> ─────────────────────────────
// <title>La Serre Africaine — Légumes africains BIO cultivés en France</title>
// <meta name="description" content="Commandez en ligne des légumes africains BIO : gombo, piment habanero, aubergine amère, bissap, chayotte. Livraison Mondial Relay partout en France." />
// <meta property="og:title" content="La Serre Africaine — Légumes africains BIO" />
// <meta property="og:image" content="https://ton-site.fr/images/serre2.jpg" />
// <meta property="og:url" content="https://ton-site.fr" />
// <meta name="theme-color" content="#1f7a3d" />

import gomboImg          from "./images/gombobouquet.png";
import habaneroImg       from "./images/piments1.jpg";
import aubergineImg      from "./images/aubegineamer.jpg";
import bissapFeuilleImg  from "./images/bissapfeuilles.png";
import bissapFleurImg    from "./images/bissapfleurs.png";
import chayotteImg       from "./images/Chayotte.png";
import packDecouverteImg from "./images/decouverte.png";
import packFamilleImg    from "./images/famille.png";
import packDiasporaImg   from "./images/diaspora.png";
import serreHeroImg      from "./images/serre2.jpg";
import engagementImg     from "./images/piment3.jpg";

// ─── Constants ────────────────────────────────────────────────────────────────
const WHATSAPP_NUMBER         = "33603908935";
const PRO_PHONE               = "06 03 90 89 35";
const PAYPAL_EMAIL            = "mandiayediallo@gmail.com";
const WERO_NUMBER             = "06 59 01 25 99"; // affiché en surbrillance
const STEP_KG                 = 0.5;
const FREE_DELIVERY_THRESHOLD = 65;
const BULK_DISCOUNT_THRESHOLD = 5;
const BULK_DISCOUNT_RATE      = 0.15;
const MR_HOME_SURCHARGE       = 3.0;

// ⚠️  Colle ici l'URL de ton déploiement Google Apps Script
// Exemple : "https://script.google.com/macros/s/XXXXX/exec"
const SHEETS_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbyrfnrWvErokZhGmTRGw0k39h3l1nIxYCdBcr7XxlV4SygPrCRaZEQKMnNwYdjQTuQuKw/exec";

const PRO_WA_MESSAGE = encodeURIComponent(
  `Bonjour La Serre Africaine,\n\nJe suis professionnel (restaurateur / épicerie / traiteur) et je souhaite discuter d'un approvisionnement régulier en légumes africains BIO.\n\nMerci !`
);

// ─── Compte rebours ───────────────────────────────────────────────────────────
const PROMO_DEADLINE = (() => {
  const d = new Date();
  const days = (5 - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + days);
  d.setHours(23, 59, 0, 0);
  return d;
})();

// ─── Indicatifs pays ──────────────────────────────────────────────────────────
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

// ─── Stock limité ─────────────────────────────────────────────────────────────
const STOCK_INFO = {
  fleurs_bissap:   { stockLeft: 3,  maxStock: 10 },
  feuilles_bissap: { stockLeft: 5,  maxStock: 10 },
};

// ─── Mondial Relay ────────────────────────────────────────────────────────────
const MR_RELAY_RATES = [
  { maxKg: 0.5,  price: 4.55  },
  { maxKg: 1,    price: 5.35  },
  { maxKg: 2,    price: 6.05  },
  { maxKg: 3,    price: 6.95  },
  { maxKg: 5,    price: 8.15  },
  { maxKg: 7,    price: 10.75 },
  { maxKg: 10,   price: 13.00 },
  { maxKg: 15,   price: 15.70 },
  { maxKg: 30,   price: 19.70 },
];
function getMRRelayPrice(w) {
  const weight = Math.max(0.1, w);
  const b = MR_RELAY_RATES.find((r) => weight <= r.maxKg);
  return b ? b.price : MR_RELAY_RATES[MR_RELAY_RATES.length - 1].price;
}
function getMRHomePrice(w) { return getMRRelayPrice(w) + MR_HOME_SURCHARGE; }

// ─── Produits & Packs ─────────────────────────────────────────────────────────
const PRODUCTS = [
  { id: "gombo",           name: "Gombo",              emoji: "🌿", pricePerKg: 12, image: gomboImg },
  { id: "habanero",        name: "Piment Habanero",    emoji: "🌶️", pricePerKg: 18, image: habaneroImg },
  { id: "aubergine",       name: "Aubergine amère",    emoji: "🍆", pricePerKg: 9,  image: aubergineImg },
  { id: "feuilles_bissap", name: "Feuilles de bissap", emoji: "🍃", pricePerKg: 14, image: bissapFeuilleImg },
  { id: "fleurs_bissap",   name: "Fleurs de bissap",   emoji: "🌺", pricePerKg: 18, image: bissapFleurImg },
  { id: "chayottes",       name: "Chayotte",            emoji: "🥒", pricePerKg: 6,  image: chayotteImg },
];

const PACKS = [
  {
    id: "pack_famille", name: "⭐ PACK FAMILLE", subtitle: "Le plus choisi",
    price: 45, isPremium: false, highlight: true, image: packFamilleImg,
    description: "Idéal pour une famille — économique et complet",
    items: [
      { label: "2 kg Gombo",            qtyKg: 2   },
      { label: "1 kg Aubergine amère",  qtyKg: 1   },
      { label: "1 kg Chayotte",         qtyKg: 1   },
      { label: "500 g Piment Habanero", qtyKg: 0.5 },
    ],
  },
  {
    id: "pack_decouverte", name: "🟢 PACK DÉCOUVERTE", subtitle: "Pour commencer",
    price: 29, isPremium: false, highlight: false, image: packDecouverteImg,
    description: "Parfait pour tester nos produits",
    items: [
      { label: "1 kg Gombo",               qtyKg: 1   },
      { label: "500 g Piment Habanero",    qtyKg: 0.5 },
      { label: "500 g Feuilles de bissap", qtyKg: 0.5 },
      { label: "1 kg Chayotte",            qtyKg: 1   },
    ],
  },
  {
    id: "pack_premium", name: "🔥 PACK PREMIUM DIASPORA", subtitle: "Pour les amoureux des saveurs authentiques",
    price: 69, isPremium: true, highlight: false, image: packDiasporaImg,
    description: "Le pack généreux pour retrouver les saveurs de chez nous",
    items: [
      { label: "2 kg Gombo",               qtyKg: 2   },
      { label: "1 kg Feuilles de bissap",  qtyKg: 1   },
      { label: "500 g Fleurs de bissap",   qtyKg: 0.5 },
      { label: "1 kg Piment Habanero",     qtyKg: 1   },
      { label: "1 kg Chayotte",            qtyKg: 1   },
    ],
  },
];

// ─── useCart ──────────────────────────────────────────────────────────────────
function useCart() {
  const [unitCart,     setUnitCart]     = useState(() => Object.fromEntries(PRODUCTS.map((p) => [p.id, 0])));
  const [packCart,     setPackCart]     = useState(() => Object.fromEntries(PACKS.map((p) => [p.id, 0])));
  const [deliveryMode, setDeliveryMode] = useState("relay");

  const updateUnit = useCallback((id, delta) =>
    setUnitCart((prev) => ({ ...prev, [id]: Math.max(0, Math.round(((prev[id] || 0) + delta) * 10) / 10) })), []);
  const updatePack = useCallback((id, delta) =>
    setPackCart((prev) => ({ ...prev, [id]: Math.max(0, (prev[id] || 0) + delta) })), []);
  const clearCart = useCallback(() => {
    setUnitCart(Object.fromEntries(PRODUCTS.map((p) => [p.id, 0])));
    setPackCart(Object.fromEntries(PACKS.map((p) => [p.id, 0])));
  }, []);

  const unitItems = useMemo(() =>
    PRODUCTS.filter((p) => unitCart[p.id] > 0).map((p) => ({
      ...p, qtyKg: unitCart[p.id], subtotal: unitCart[p.id] * p.pricePerKg,
    })), [unitCart]);

  const totalUnitWeight = useMemo(() => unitItems.reduce((s, i) => s + i.qtyKg, 0), [unitItems]);
  const bulkDiscount    = totalUnitWeight >= BULK_DISCOUNT_THRESHOLD;
  const discountRate    = bulkDiscount ? BULK_DISCOUNT_RATE : 0;

  const unitItemsWithDiscount = useMemo(() =>
    unitItems.map((item) => ({ ...item, discountedTotal: item.subtotal * (1 - discountRate) })),
    [unitItems, discountRate]);

  const selectedPacks = useMemo(() =>
    PACKS.filter((p) => packCart[p.id] > 0).map((p) => ({ ...p, quantity: packCart[p.id] })), [packCart]);

  const unitSubtotal  = useMemo(() => unitItemsWithDiscount.reduce((s, i) => s + i.discountedTotal, 0), [unitItemsWithDiscount]);
  const packsSubtotal = useMemo(() => selectedPacks.reduce((s, p) => s + p.price * p.quantity, 0), [selectedPacks]);
  const subtotal      = unitSubtotal + packsSubtotal;

  const totalPackWeight = useMemo(() =>
    selectedPacks.reduce((s, pk) => s + pk.items.reduce((a, b) => a + b.qtyKg, 0) * pk.quantity, 0), [selectedPacks]);
  const totalWeight = totalUnitWeight + totalPackWeight;

  const hasPremiumPack = selectedPacks.some((p) => p.isPremium);
  const relayIsFree    = subtotal >= FREE_DELIVERY_THRESHOLD || hasPremiumPack;
  const relayPrice     = getMRRelayPrice(totalWeight);
  const homePrice      = getMRHomePrice(totalWeight);

  const deliveryCost = subtotal === 0 ? 0
    : deliveryMode === "home" ? homePrice
    : relayIsFree ? 0 : relayPrice;

  const grandTotal    = subtotal + deliveryCost;
  const savingsToFree = Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal);
  const totalItems    = selectedPacks.length + (unitItems.length > 0 ? 1 : 0);

  return {
    unitCart, packCart, unitItemsWithDiscount, selectedPacks,
    subtotal, grandTotal, deliveryCost, relayIsFree, hasPremiumPack,
    totalWeight, totalUnitWeight, totalItems, savingsToFree,
    bulkDiscount, discountRate, relayPrice, homePrice,
    deliveryMode, setDeliveryMode,
    updateUnit, updatePack, clearCart,
  };
}

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  green: "#1f7a3d", greenDark: "#166534", greenLight: "#f0fdf4", greenBorder: "#d1fae5",
  amber: "#92400e", amberLight: "#fef3c7",
  gray: "#4b5563", grayLight: "#f9fafb",
  red: "#9a3412", redLight: "#fff7ed",
  border: "#e5e7eb", white: "#fff", bg: "#f4f8f1", bgAlt: "#f0fdf4", bgAmber: "#fffbeb",
};

const card     = { background: T.white, borderRadius: 16, boxShadow: "0 4px 18px rgba(0,0,0,0.06)", padding: 20, border: `1px solid ${T.border}` };
const greenBtn = { border: "none", background: T.green, color: T.white, borderRadius: 10, padding: "11px 14px", fontWeight: "bold", cursor: "pointer", width: "100%", fontSize: 14 };
const qtyBtn   = { border: "none", background: T.green, color: T.white, width: 34, height: 34, borderRadius: 8, fontSize: 18, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" };
const cartLine = { display: "flex", justifyContent: "space-between", gap: 8, padding: "8px 0", borderBottom: `1px solid ${T.border}`, alignItems: "center" };
const warn     = { background: T.redLight, color: T.red, border: "1px solid #fdba74", padding: "10px 14px", borderRadius: 10, marginTop: 12, fontSize: 13 };
const disBtn   = { background: "#d1d5db", color: T.white, border: "none", borderRadius: 12, padding: "14px 16px", fontSize: 15, fontWeight: "bold", width: "100%", marginTop: 14, cursor: "not-allowed" };

// ─── Envoi commande vers Google Sheets ───────────────────────────────────────
async function sendToSheets(payload) {
  if (!SHEETS_WEBHOOK_URL || SHEETS_WEBHOOK_URL === "COLLE_TON_URL_ICI") {
    console.warn("⚠️ SHEETS_WEBHOOK_URL non configurée");
    return;
  }
  try {
    const encoded = encodeURIComponent(JSON.stringify(payload));
    const url     = `${SHEETS_WEBHOOK_URL}?data=${encoded}`;
    // Méthode Image — la plus fiable avec Apps Script (contourne CORS)
    await new Promise((resolve) => {
      const img = new Image();
      img.onload  = resolve;
      img.onerror = resolve; // on résout même en cas d'erreur, c'est normal
      img.src = url;
    });
    console.log("✅ Commande envoyée vers Google Sheets");
  } catch (err) {
    console.warn("Sheets error (non bloquant):", err);
  }
}

// ─── Build WhatsApp message ───────────────────────────────────────────────────
function buildWAMessage(cart, customer, fullPhone) {
  const { unitItemsWithDiscount, selectedPacks, subtotal, grandTotal, deliveryCost, deliveryMode, bulkDiscount, totalWeight } = cart;
  const packLines = selectedPacks.length
    ? selectedPacks.map((p) => `- ${p.name} ×${p.quantity} = ${(p.price * p.quantity).toFixed(2)} €`).join("\n")
    : "Aucun pack";
  const unitLines = unitItemsWithDiscount.length
    ? unitItemsWithDiscount.map((i) => `- ${i.emoji} ${i.name} : ${i.qtyKg.toFixed(1).replace(".0", "")} kg × ${i.pricePerKg.toFixed(2)} €/kg = ${i.discountedTotal.toFixed(2)} €${bulkDiscount ? " (−15%)" : ""}`).join("\n")
    : "Aucun produit à l'unité";
  return `Bonjour, je souhaite valider cette commande :

Packs :
${packLines}

Produits à l'unité :
${unitLines}
${bulkDiscount ? "\n⚡ Réduction −15% appliquée (≥ 5 kg)" : ""}
Poids total : ${totalWeight.toFixed(1).replace(".0", "")} kg
Sous-total : ${subtotal.toFixed(2)} €
Livraison (${deliveryMode === "home" ? "Domicile" : "Point Relais"}) : ${deliveryCost === 0 ? "offerte" : `${deliveryCost.toFixed(2)} €`}
Total : ${grandTotal.toFixed(2)} €

Client :
Nom : ${customer.prenom} ${customer.nom}
Téléphone : ${fullPhone}
Adresse : ${customer.adresse}, ${customer.codePostal} ${customer.ville}, ${customer.pays}`;
}

// ─── Section / SectionTitle ───────────────────────────────────────────────────
function Section({ id, bg, children, style = {} }) {
  return (
    <section id={id} style={{ background: bg || "transparent", padding: "28px 0", ...style }}>
      <div style={{ maxWidth: 1380, margin: "0 auto", padding: "0 16px" }}>{children}</div>
    </section>
  );
}

function SectionTitle({ emoji, title, subtitle, action }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10, marginBottom: 20 }}>
      <div>
        <h2 style={{ margin: 0, color: T.greenDark, fontSize: 28, fontWeight: "bold", letterSpacing: "-0.3px" }}>
          {emoji && <span style={{ marginRight: 10 }}>{emoji}</span>}{title}
        </h2>
        {subtitle && <p style={{ margin: "6px 0 0", color: T.gray, fontSize: 14, lineHeight: 1.6 }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// ─── Countdown ────────────────────────────────────────────────────────────────
function CountdownBanner() {
  const [timeLeft, setTimeLeft] = useState({});
  useEffect(() => {
    const calc = () => {
      const diff = PROMO_DEADLINE - new Date();
      if (diff <= 0) return setTimeLeft(null);
      setTimeLeft({ j: Math.floor(diff / 86400000), h: Math.floor((diff % 86400000) / 3600000), m: Math.floor((diff % 3600000) / 60000), s: Math.floor((diff % 60000) / 1000) });
    };
    calc(); const id = setInterval(calc, 1000); return () => clearInterval(id);
  }, []);
  if (!timeLeft) return null;
  const pad  = (n) => String(n).padStart(2, "0");
  const unit = (n, label) => (
    <div style={{ textAlign: "center", minWidth: 36 }}>
      <div style={{ fontSize: 20, fontWeight: "bold", lineHeight: 1 }}>{pad(n)}</div>
      <div style={{ fontSize: 9, opacity: 0.8, marginTop: 2 }}>{label}</div>
    </div>
  );
  const sep = <div style={{ fontSize: 20, fontWeight: "bold", alignSelf: "flex-start", marginTop: 2, opacity: 0.7 }}>:</div>;
  return (
    <div style={{ background: "#14532d", color: T.white, padding: "9px 16px", display: "flex", alignItems: "center", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
      <span style={{ fontSize: 13, fontWeight: "bold" }}>⏱️ Commandez avant vendredi 23h59 pour une livraison cette semaine !</span>
      <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(0,0,0,0.25)", borderRadius: 8, padding: "6px 14px" }}>
        {timeLeft.j > 0 && <>{unit(timeLeft.j, "jours")}{sep}</>}
        {unit(timeLeft.h, "h")}{sep}{unit(timeLeft.m, "min")}{sep}{unit(timeLeft.s, "sec")}
      </div>
    </div>
  );
}

// ─── Trust band ───────────────────────────────────────────────────────────────
function TrustBand() {
  const items = [
    { icon: "🌱", label: "100% BIO certifié",       sub: "Sans pesticides"          },
    { icon: "🚀", label: "Livraison Mondial Relay",  sub: "3–5 jours ouvrés"        },
    { icon: "❄️", label: "Fraîcheur garantie",       sub: "Récolte hebdomadaire"    },
    { icon: "💳", label: "Paiement sécurisé",        sub: "Wero · PayPal · Virement"},
    { icon: "🇫🇷", label: "Cultivé en France",       sub: "Circuit court, local"    },
    { icon: "🤝", label: "Service client réactif",   sub: "Réponse sous 24h"        },
  ];
  return (
    <div style={{ background: T.white, borderBottom: `1px solid ${T.border}` }}>
      <div style={{ maxWidth: 1380, margin: "0 auto", padding: "0 16px", display: "flex", overflowX: "auto", gap: 0 }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 20px", flexShrink: 0, borderRight: `1px solid ${T.border}` }}>
            <span style={{ fontSize: 20 }}>{item.icon}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: "bold", color: "#1f2937", whiteSpace: "nowrap" }}>{item.label}</div>
              <div style={{ fontSize: 11, color: T.gray, whiteSpace: "nowrap" }}>{item.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Floating WhatsApp ────────────────────────────────────────────────────────
function FloatingWA() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const fn = () => setVisible(window.scrollY > 300);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);
  return (
    <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer" title="Contactez-nous sur WhatsApp"
      style={{ position: "fixed", bottom: 80, right: 20, zIndex: 80, background: "#25D366", color: T.white, borderRadius: "50%", width: 56, height: 56, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 18px rgba(37,211,102,0.45)", opacity: visible ? 1 : 0, pointerEvents: visible ? "auto" : "none", transition: "opacity 0.3s, transform 0.3s", transform: visible ? "scale(1)" : "scale(0.8)", textDecoration: "none", fontSize: 28 }}>
      💬
    </a>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ show }) {
  return (
    <div style={{ position: "fixed", bottom: 90, left: "50%", transform: `translateX(-50%) translateY(${show ? 0 : 20}px)`, background: T.green, color: T.white, padding: "10px 22px", borderRadius: 999, fontSize: 14, fontWeight: "bold", opacity: show ? 1 : 0, transition: "all 0.3s", pointerEvents: "none", zIndex: 100, whiteSpace: "nowrap" }}>
      ✓ Ajouté au panier
    </div>
  );
}

// ─── Stock indicator ──────────────────────────────────────────────────────────
function StockIndicator({ productId }) {
  const info = STOCK_INFO[productId];
  if (!info) return null;
  const pct   = Math.round((info.stockLeft / info.maxStock) * 100);
  const color = info.stockLeft <= 3 ? "#dc2626" : "#d97706";
  const bg    = info.stockLeft <= 3 ? "#fef2f2" : "#fffbeb";
  return (
    <div style={{ background: bg, border: `1px solid ${color}30`, borderRadius: 8, padding: "6px 10px", marginTop: 8 }}>
      <span style={{ fontSize: 12, fontWeight: "bold", color }}>
        {info.stockLeft <= 3 ? "🔴" : "🟡"} Stock limité — {info.stockLeft} kg restants
      </span>
      <div style={{ background: "#e5e7eb", borderRadius: 999, height: 4, overflow: "hidden", marginTop: 4 }}>
        <div style={{ background: color, width: `${pct}%`, height: "100%", borderRadius: 999 }} />
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

function PhoneInput({ countryCode, phoneNumber, onCountryChange, onPhoneChange }) {
  const [touched, setTouched] = useState(false);
  const isValid     = touched ? phoneNumber.replace(/\D/g, "").length >= 7 : null;
  const borderColor = isValid === null ? "#cbd5e1" : isValid ? "#22c55e" : "#ef4444";
  return (
    <div style={{ display: "flex", gap: 8, gridColumn: "1 / -1" }}>
      <select value={countryCode} onChange={(e) => onCountryChange(e.target.value)}
        style={{ padding: "11px 8px", fontSize: 14, borderRadius: 8, border: "1.5px solid #cbd5e1", background: T.white, flexShrink: 0, width: 130, cursor: "pointer" }}>
        {COUNTRY_CODES.map((c) => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
      </select>
      <div style={{ position: "relative", flex: 1 }}>
        <input type="tel" placeholder="Numéro (sans le 0 initial)" value={phoneNumber}
          onChange={(e) => onPhoneChange(e.target.value.replace(/\D/g, ""))}
          onBlur={() => setTouched(true)}
          style={{ padding: "11px 36px 11px 12px", fontSize: 14, borderRadius: 8, border: `1.5px solid ${borderColor}`, width: "100%", background: T.white, boxSizing: "border-box" }} />
        {isValid !== null && (
          <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: isValid ? "#22c55e" : "#ef4444", fontSize: 16, fontWeight: "bold" }}>
            {isValid ? "✓" : "✗"}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────
function ProgressBar({ subtotal, relayIsFree, hasPremiumPack }) {
  const pct = Math.min(100, (subtotal / FREE_DELIVERY_THRESHOLD) * 100);
  const msg = relayIsFree
    ? hasPremiumPack ? "🎁 Livraison Relais offerte — Pack Premium !" : "🎁 Livraison Relais offerte !"
    : `Encore ${(FREE_DELIVERY_THRESHOLD - subtotal).toFixed(2)} € pour la livraison Relais gratuite`;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 12, color: relayIsFree ? T.greenDark : T.gray, marginBottom: 5, fontWeight: "bold" }}>{msg}</div>
      <div style={{ background: "#e5e7eb", borderRadius: 999, height: 6, overflow: "hidden" }}>
        <div style={{ background: relayIsFree ? "#22c55e" : T.green, width: `${pct}%`, height: "100%", borderRadius: 999, transition: "width 0.4s" }} />
      </div>
    </div>
  );
}

function QtyControls({ value, onDecrement, onIncrement, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <button type="button" onClick={onDecrement} style={qtyBtn} aria-label={`Retirer ${label}`}>−</button>
      <span style={{ minWidth: 52, textAlign: "center", fontWeight: "bold", fontSize: 15 }}>{value}</span>
      <button type="button" onClick={onIncrement} style={qtyBtn} aria-label={`Ajouter ${label}`}>+</button>
    </div>
  );
}

function BulkBanner({ totalUnitWeight, bulkDiscount }) {
  if (totalUnitWeight === 0) return null;
  return bulkDiscount ? (
    <div style={{ background: T.amberLight, border: "1px solid #fcd34d", color: T.amber, borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontWeight: "bold", fontSize: 13 }}>
      🎉 Réduction −15% appliquée (≥ 5 kg à l'unité) !
    </div>
  ) : (
    <div style={{ background: "#fffbeb", border: "1px solid #fde68a", color: T.amber, borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontSize: 13 }}>
      💡 Encore <strong>{(BULK_DISCOUNT_THRESHOLD - totalUnitWeight).toFixed(1).replace(".0", "")} kg</strong> pour obtenir <strong>−15%</strong> sur tous vos produits à l'unité !
    </div>
  );
}

function DeliverySelector({ mode, setMode, relayPrice, homePrice, relayIsFree, subtotal }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontWeight: "bold", color: T.greenDark, marginBottom: 8, fontSize: 14 }}>Mode de livraison</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {[
          { key: "relay", icon: "📦", label: "Point Relais", price: subtotal > 0 && relayIsFree ? <span style={{ color: T.greenDark }}>Offerte 🎁</span> : `${relayPrice.toFixed(2)} €`, note: "3–5 j ouvrés" },
          { key: "home",  icon: "🏠", label: "À domicile",   price: `${homePrice.toFixed(2)} €`, note: "Toujours payante" },
        ].map((opt) => (
          <button key={opt.key} type="button" onClick={() => setMode(opt.key)} style={{ padding: "10px 12px", borderRadius: 10, cursor: "pointer", textAlign: "left", border: mode === opt.key ? `2px solid ${T.green}` : `1px solid ${T.border}`, background: mode === opt.key ? T.greenLight : T.white, transition: "all 0.2s" }}>
            <div style={{ fontWeight: "bold", fontSize: 13, color: T.greenDark }}>{opt.icon} {opt.label}</div>
            <div style={{ fontSize: 11, color: opt.key === "home" ? "#9a3412" : T.gray, marginTop: 2 }}>{opt.note}</div>
            <div style={{ fontWeight: "bold", marginTop: 5, fontSize: 14 }}>{opt.price}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Product card ─────────────────────────────────────────────────────────────
function ProductCard({ product, qty, onDecrement, onIncrement, onAdd, bulkDiscount }) {
  const sub      = qty * product.pricePerKg;
  const discounted = sub * (1 - (bulkDiscount ? BULK_DISCOUNT_RATE : 0));
  const hasStock = !!STOCK_INFO[product.id];
  return (
    <div style={{ ...card, position: "relative", border: hasStock ? "1.5px solid #fca5a5" : `1px solid ${T.border}` }}>
      {hasStock && (
        <div style={{ position: "absolute", top: 12, left: 12, background: "#dc2626", color: T.white, borderRadius: 999, padding: "3px 10px", fontSize: 11, fontWeight: "bold", zIndex: 1 }}>
          Stock limité
        </div>
      )}
      <img src={product.image} alt={product.name} style={{ width: "100%", height: 170, objectFit: "cover", borderRadius: 10, marginBottom: 12 }} />
      <div style={{ fontSize: 16, fontWeight: "bold", color: T.greenDark, marginBottom: 4 }}>{product.emoji} {product.name}</div>
      <div style={{ color: T.greenDark, fontWeight: "bold", fontSize: 14, marginBottom: 2 }}>{product.pricePerKg.toFixed(2)} € / kg</div>
      <div style={{ color: T.gray, fontSize: 12, marginBottom: 8 }}>Unité : 0,5 kg</div>
      <StockIndicator productId={product.id} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "10px 0" }}>
        <QtyControls value={qty > 0 ? `${qty.toFixed(1).replace(".0", "")} kg` : "0 kg"} onDecrement={onDecrement} onIncrement={onIncrement} label={product.name} />
        <div style={{ textAlign: "right" }}>
          {bulkDiscount && sub > 0 && <div style={{ fontSize: 11, color: "#9ca3af", textDecoration: "line-through" }}>{sub.toFixed(2)} €</div>}
          <div style={{ fontWeight: "bold", color: bulkDiscount ? T.greenDark : "#1f2937", fontSize: 15 }}>{discounted.toFixed(2)} €</div>
        </div>
      </div>
      <button type="button" onClick={onAdd} style={greenBtn}>+ Ajouter 0,5 kg</button>
    </div>
  );
}

// ─── Pack card ────────────────────────────────────────────────────────────────
function PackCard({ pack, qty, onDecrement, onIncrement, onAdd }) {
  return (
    <div style={{ ...card, border: pack.highlight ? "2px solid #22c55e" : `1px solid ${T.border}`, position: "relative", boxShadow: pack.highlight ? "0 8px 24px rgba(34,197,94,0.14)" : undefined }}>
      {pack.highlight && <div style={{ position: "absolute", top: 14, right: 14, background: "#22c55e", color: T.white, borderRadius: 999, padding: "5px 12px", fontSize: 11, fontWeight: "bold" }}>Best seller</div>}
      {pack.image && <img src={pack.image} alt={pack.name} style={{ width: "100%", height: 200, objectFit: "cover", borderRadius: 12, marginBottom: 14 }} />}
      <h3 style={{ fontSize: 19, color: T.greenDark, margin: "0 0 4px", fontWeight: "bold" }}>{pack.name}</h3>
      <p style={{ color: T.gray, fontWeight: "bold", margin: "0 0 12px", fontSize: 13 }}>{pack.subtitle}</p>
      <ul style={{ paddingLeft: 18, margin: "0 0 14px", lineHeight: 1.8, color: "#1f2937", fontSize: 14 }}>
        {pack.items.map((item) => <li key={item.label}>{item.label}</li>)}
      </ul>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 26, color: T.greenDark, fontWeight: "bold" }}>{pack.price.toFixed(2)} €</span>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {pack.isPremium && <span style={{ background: T.greenLight, color: T.greenDark, fontWeight: "bold", padding: "4px 10px", borderRadius: 999, fontSize: 12 }}>🚚 Livraison Relais offerte</span>}
          {pack.highlight && <span style={{ background: T.amberLight, color: T.amber, fontWeight: "bold", padding: "4px 10px", borderRadius: 999, fontSize: 12 }}>Le plus avantageux</span>}
        </div>
      </div>
      <p style={{ color: T.gray, fontSize: 13, margin: "0 0 14px" }}>{pack.description}</p>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <QtyControls value={qty} onDecrement={onDecrement} onIncrement={onIncrement} label={pack.name} />
        <button type="button" onClick={onAdd} style={{ ...greenBtn, flex: 1 }}>Ajouter au panier</button>
      </div>
    </div>
  );
}

// ─── Cart content ─────────────────────────────────────────────────────────────
function CartContent({ cart, onValidate, missingFields }) {
  const { subtotal, grandTotal, deliveryCost, relayIsFree, hasPremiumPack, totalItems, totalWeight, unitItemsWithDiscount, selectedPacks, savingsToFree, bulkDiscount, totalUnitWeight, deliveryMode, setDeliveryMode, relayPrice, homePrice, clearCart } = cart;
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h3 style={{ margin: 0, color: T.greenDark, fontSize: 17 }}>
          🛒 Panier{totalItems > 0 && <span style={{ background: "#22c55e", color: T.white, borderRadius: 999, padding: "2px 8px", fontSize: 11, marginLeft: 6 }}>{totalItems}</span>}
        </h3>
        {subtotal > 0 && <button type="button" onClick={clearCart} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 12, fontWeight: "bold" }}>Vider</button>}
      </div>
      {subtotal <= 0 ? (
        <p style={{ color: "#9ca3af", fontSize: 14, textAlign: "center", padding: "20px 0" }}>Aucun produit sélectionné.</p>
      ) : (
        <>
          <ProgressBar subtotal={subtotal} relayIsFree={relayIsFree} hasPremiumPack={hasPremiumPack} />
          <BulkBanner totalUnitWeight={totalUnitWeight} bulkDiscount={bulkDiscount} />
          {selectedPacks.map((p) => (
            <div key={p.id} style={cartLine}>
              <span style={{ fontSize: 13 }}>{p.name} × {p.quantity}</span>
              <strong style={{ fontSize: 13 }}>{(p.price * p.quantity).toFixed(2)} €</strong>
            </div>
          ))}
          {unitItemsWithDiscount.map((item) => (
            <div key={item.id} style={cartLine}>
              <span style={{ fontSize: 13 }}>{item.emoji} {item.name} — {item.qtyKg.toFixed(1).replace(".0", "")} kg</span>
              <div style={{ textAlign: "right" }}>
                {bulkDiscount && <div style={{ fontSize: 11, color: "#9ca3af", textDecoration: "line-through" }}>{item.subtotal.toFixed(2)} €</div>}
                <strong style={{ fontSize: 13 }}>{item.discountedTotal.toFixed(2)} €</strong>
              </div>
            </div>
          ))}
          <div style={{ ...cartLine, borderBottom: "none" }}>
            <span style={{ fontSize: 13, color: T.gray }}>Poids estimé</span>
            <span style={{ fontSize: 13 }}>{totalWeight.toFixed(1).replace(".0", "")} kg</span>
          </div>
          <div style={cartLine}><span style={{ fontSize: 13 }}>Sous-total</span><strong style={{ fontSize: 13 }}>{subtotal.toFixed(2)} €</strong></div>
          <div style={{ margin: "12px 0" }}>
            <DeliverySelector mode={deliveryMode} setMode={setDeliveryMode} relayPrice={relayPrice} homePrice={homePrice} relayIsFree={relayIsFree} subtotal={subtotal} />
          </div>
          <div style={{ ...cartLine, borderBottom: "none" }}>
            <span style={{ fontWeight: "bold" }}>Livraison</span>
            <strong style={{ color: deliveryCost === 0 ? T.greenDark : "#1f2937" }}>{deliveryCost === 0 ? "Offerte 🎉" : `${deliveryCost.toFixed(2)} €`}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0 0", fontWeight: "bold", fontSize: 18, borderTop: `2px solid ${T.border}`, marginTop: 8 }}>
            <span>Total</span><span style={{ color: T.greenDark }}>{grandTotal.toFixed(2)} €</span>
          </div>
        </>
      )}
      {subtotal > 0 && !relayIsFree && deliveryMode === "relay" && <div style={warn}>Encore {savingsToFree.toFixed(2)} € pour la livraison Relais offerte.</div>}
      {deliveryMode === "home" && subtotal > 0 && <div style={{ ...warn, background: "#eff6ff", color: "#1e40af", border: "1px solid #93c5fd" }}>ℹ️ La livraison à domicile est toujours payante ({homePrice.toFixed(2)} €).</div>}
      {missingFields && subtotal > 0 && <div style={warn}>Remplissez tous les champs client pour valider.</div>}
      {subtotal > 0 && !missingFields
        ? <button type="button" onClick={onValidate} style={{ background: T.green, color: T.white, border: "none", borderRadius: 12, padding: "15px 16px", fontSize: 15, fontWeight: "bold", cursor: "pointer", width: "100%", marginTop: 14, boxShadow: "0 6px 18px rgba(31,122,61,0.22)" }}>Voir le récapitulatif →</button>
        : <button type="button" style={disBtn} disabled>Voir le récapitulatif →</button>}
    </>
  );
}

// ─── Payment modal — Wero corrigé ─────────────────────────────────────────────
function PaymentModal({ grandTotal, customer, onClose, onPaymentChosen }) {
  const [selected, setSelected] = useState(null);
  const [copied,   setCopied]   = useState(false);
  const amount    = grandTotal.toFixed(2);
  const paypalUrl = `https://www.paypal.com/paypalme/${PAYPAL_EMAIL.split("@")[0]}/${amount}EUR`;

  const copyWero = () => {
    navigator.clipboard.writeText(WERO_NUMBER.replace(/\s/g, "")).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
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
          <div style={{ fontSize: 12, color: "#9ca3af", textAlign: "center", marginTop: 8 }}>
            Le montant ({amount} €) est pré-rempli automatiquement.
          </div>
        </>
      ),
    },
    {
      id: "Wero", label: "Wero", color: "#5b21b6", bg: "#f5f3ff", icon: "💜",
      desc: "Paiement manuel — envoyez le montant via votre app Wero",
      content: (
        <>
          <div style={{ fontSize: 13, color: T.gray, marginBottom: 12 }}>
            Ouvrez votre app Wero et envoyez <strong>{amount} €</strong> au numéro ci-dessous :
          </div>
          {/* Numéro en surbrillance */}
          <div style={{ background: "#5b21b6", borderRadius: 14, padding: "18px 20px", textAlign: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", marginBottom: 6, letterSpacing: 1 }}>NUMÉRO WERO</div>
            <div style={{ fontSize: 28, fontWeight: "bold", color: T.white, letterSpacing: 3, fontFamily: "monospace" }}>
              {WERO_NUMBER}
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 6 }}>La Serre Africaine</div>
          </div>
          <button
            type="button"
            onClick={() => { copyWero(); onPaymentChosen("Wero"); }}
            style={{ border: "2px solid #5b21b6", background: copied ? "#5b21b6" : T.white, color: copied ? T.white : "#5b21b6", borderRadius: 10, padding: "11px", fontWeight: "bold", cursor: "pointer", width: "100%", fontSize: 14, transition: "all 0.2s" }}
          >
            {copied ? "✓ Numéro copié !" : "📋 Copier le numéro"}
          </button>
          <div style={{ background: T.amberLight, border: "1px solid #fcd34d", borderRadius: 8, padding: "8px 12px", marginTop: 10, fontSize: 12, color: T.amber }}>
            ⚠️ Indiquez bien la référence <strong>La Serre Africaine</strong> lors de votre envoi Wero.
          </div>
        </>
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
            ["IBAN", "FR76 XXXX XXXX XXXX XXXX XXXX XXX"], // ← remplace par ton vrai IBAN
            ["Référence", `Cmd-${customer?.nom?.toUpperCase() || "CLIENT"}`],
            ["Montant", `${amount} €`],
          ].map(([l, v]) => (
            <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #f0fdf4" }}>
              <span style={{ color: T.gray }}>{l}</span>
              <strong style={{ fontFamily: l === "IBAN" ? "monospace" : undefined, fontSize: l === "IBAN" ? 12 : undefined, color: l === "Montant" ? T.greenDark : undefined }}>{v}</strong>
            </div>
          ))}
          <div style={{ background: T.redLight, color: T.red, borderRadius: 8, padding: 8, marginTop: 10, fontSize: 12 }}>
            ⚠️ Remplace l'IBAN ci-dessus par le tien dans App.jsx
          </div>
          <button type="button" onClick={() => onPaymentChosen("Virement")} style={{ border: "none", background: T.green, color: T.white, borderRadius: 10, padding: "11px", fontWeight: "bold", cursor: "pointer", width: "100%", fontSize: 14, marginTop: 12 }}>
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
        <div style={{ background: T.greenLight, borderRadius: 10, padding: "10px 14px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: T.greenDark, fontWeight: "bold", fontSize: 14 }}>Total à régler</span>
          <span style={{ color: T.greenDark, fontWeight: "bold", fontSize: 22 }}>{amount} €</span>
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
          <strong>Après paiement :</strong> votre commande sera confirmée par WhatsApp sous 24h. Conservez votre justificatif.
        </div>
      </div>
    </div>
  );
}

// ─── Confirmation page ────────────────────────────────────────────────────────
function ConfirmationPage({ cart, customer, fullPhone, onBack }) {
  const { unitItemsWithDiscount, selectedPacks, subtotal, grandTotal, deliveryCost, deliveryMode, bulkDiscount, totalWeight } = cart;
  const [showPayment,   setShowPayment]   = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [sheetSent,     setSheetSent]     = useState(false);

  const waMsg = buildWAMessage(cart, customer, fullPhone);
  const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(waMsg)}`;

  // Envoi vers Sheets au clic WhatsApp
  const handleWAClick = useCallback(async () => {
    if (sheetSent) return;
    const payload = {
      customer,
      fullPhone,
      unitItems:     unitItemsWithDiscount,
      selectedPacks,
      subtotal,
      grandTotal,
      deliveryCost,
      deliveryMode,
      bulkDiscount,
      totalWeight,
      paymentMethod: paymentMethod || "Non renseigné",
    };
    await sendToSheets(payload);
    setSheetSent(true);
  }, [sheetSent, customer, fullPhone, unitItemsWithDiscount, selectedPacks, subtotal, grandTotal, deliveryCost, deliveryMode, bulkDiscount, totalWeight, paymentMethod]);

  const handlePaymentChosen = (method) => {
    setPaymentMethod(method);
  };

  return (
    <div style={{ background: T.bg, minHeight: "100vh" }}>
      {showPayment && (
        <PaymentModal
          grandTotal={grandTotal}
          customer={customer}
          onClose={() => setShowPayment(false)}
          onPaymentChosen={handlePaymentChosen}
        />
      )}

      <div style={{ background: T.green, color: T.white, padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
        <button type="button" onClick={onBack} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: T.white, borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontWeight: "bold", fontSize: 13 }}>← Retour</button>
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: "bold" }}>Récapitulatif de commande</h1>
      </div>

      <div style={{ maxWidth: 600, margin: "0 auto", padding: "24px 16px" }}>
        {/* Succès */}
        <div style={{ ...card, marginBottom: 20, textAlign: "center" }}>
          <div style={{ fontSize: 52, marginBottom: 10 }}>✅</div>
          <h2 style={{ color: T.greenDark, margin: "0 0 8px", fontSize: 22 }}>Commande préparée !</h2>
          <p style={{ color: T.gray, fontSize: 14, margin: "0 0 16px" }}>Confirmez sur WhatsApp puis procédez au paiement.</p>
          {paymentMethod && (
            <div style={{ background: T.greenLight, border: `1px solid ${T.greenBorder}`, borderRadius: 8, padding: "8px 12px", fontSize: 13, color: T.greenDark, fontWeight: "bold" }}>
              💳 Mode de paiement choisi : {paymentMethod}
            </div>
          )}
        </div>

        {/* Infos client */}
        <div style={{ ...card, marginBottom: 16 }}>
          <h3 style={{ color: T.greenDark, margin: "0 0 14px", fontSize: 17 }}>👤 Vos informations</h3>
          {[["Nom", `${customer.prenom} ${customer.nom}`], ["Téléphone", fullPhone], ["Adresse", `${customer.adresse}, ${customer.codePostal} ${customer.ville}`], ["Pays", customer.pays], ["Livraison", deliveryMode === "home" ? "À domicile" : "Point Relais"]].map(([l, v]) => (
            <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${T.border}`, fontSize: 14 }}>
              <span style={{ color: T.gray }}>{l}</span><span style={{ fontWeight: "bold" }}>{v}</span>
            </div>
          ))}
        </div>

        {/* Récap commande */}
        <div style={{ ...card, marginBottom: 16 }}>
          <h3 style={{ color: T.greenDark, margin: "0 0 14px", fontSize: 17 }}>🛒 Votre commande</h3>
          {bulkDiscount && <div style={{ background: T.amberLight, border: "1px solid #fcd34d", color: T.amber, borderRadius: 8, padding: "8px 12px", marginBottom: 12, fontSize: 13, fontWeight: "bold" }}>🎉 Réduction −15% appliquée (≥ 5 kg)</div>}
          {selectedPacks.map((p) => <div key={p.id} style={cartLine}><span style={{ fontSize: 14 }}>{p.name} × {p.quantity}</span><strong>{(p.price * p.quantity).toFixed(2)} €</strong></div>)}
          {unitItemsWithDiscount.map((i) => (
            <div key={i.id} style={cartLine}>
              <span style={{ fontSize: 14 }}>{i.emoji} {i.name} — {i.qtyKg.toFixed(1).replace(".0", "")} kg</span>
              <div style={{ textAlign: "right" }}>
                {bulkDiscount && <div style={{ fontSize: 11, color: "#9ca3af", textDecoration: "line-through" }}>{i.subtotal.toFixed(2)} €</div>}
                <strong>{i.discountedTotal.toFixed(2)} €</strong>
              </div>
            </div>
          ))}
          <div style={{ ...cartLine, borderBottom: "none" }}><span style={{ color: T.gray, fontSize: 13 }}>Poids total</span><span style={{ fontSize: 13 }}>{totalWeight.toFixed(1).replace(".0", "")} kg</span></div>
          <div style={cartLine}><span>Sous-total</span><strong>{subtotal.toFixed(2)} €</strong></div>
          <div style={cartLine}><span>Livraison</span><strong style={{ color: deliveryCost === 0 ? T.greenDark : "#1f2937" }}>{deliveryCost === 0 ? "Offerte 🎉" : `${deliveryCost.toFixed(2)} €`}</strong></div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "14px 0 0", fontWeight: "bold", fontSize: 20, borderTop: `2px solid ${T.border}`, marginTop: 6 }}>
            <span>Total</span><span style={{ color: T.greenDark }}>{grandTotal.toFixed(2)} €</span>
          </div>
        </div>

        {/* Étapes */}
        <div style={{ ...card, marginBottom: 20 }}>
          <h3 style={{ color: T.greenDark, margin: "0 0 16px", fontSize: 17 }}>📋 Prochaines étapes</h3>
          {[
            { num: "1", title: "Confirmer sur WhatsApp", desc: "Votre commande est enregistrée automatiquement dans notre tableau de suivi.", color: T.greenLight },
            { num: "2", title: "Régler votre commande",  desc: "Choisissez Wero, PayPal ou virement bancaire.", color: "#e0f2fe" },
            { num: "3", title: "Expédition sous 48h",    desc: "Votre colis est préparé et expédié via Mondial Relay.", color: T.amberLight },
            { num: "4", title: "Livraison en 3–5 jours", desc: "Recevez vos légumes frais au Point Relais ou à domicile.", color: "#f3e8ff" },
          ].map((step) => (
            <div key={step.num} style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 14 }}>
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: step.color, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", color: T.greenDark, flexShrink: 0, fontSize: 15 }}>{step.num}</div>
              <div><div style={{ fontWeight: "bold", fontSize: 14, marginBottom: 2 }}>{step.title}</div><div style={{ color: T.gray, fontSize: 13 }}>{step.desc}</div></div>
            </div>
          ))}
        </div>

        {/* Boutons */}
        <div style={{ display: "grid", gap: 12 }}>
          <a href={waUrl} target="_blank" rel="noreferrer" onClick={handleWAClick}>
            <button type="button" style={{ background: "#25D366", color: T.white, border: "none", borderRadius: 14, padding: "16px", fontSize: 16, fontWeight: "bold", cursor: "pointer", width: "100%", boxShadow: "0 6px 18px rgba(37,211,102,0.28)" }}>
              1️⃣ Confirmer sur WhatsApp
              {sheetSent && <span style={{ fontSize: 12, opacity: 0.85, marginLeft: 8 }}>✓ enregistré</span>}
            </button>
          </a>
          <button type="button" onClick={() => setShowPayment(true)}
            style={{ background: T.green, color: T.white, border: "none", borderRadius: 14, padding: "16px", fontSize: 16, fontWeight: "bold", cursor: "pointer", width: "100%", boxShadow: "0 6px 18px rgba(31,122,61,0.22)" }}>
            2️⃣ Payer ma commande ({grandTotal.toFixed(2)} €)
            {paymentMethod && <span style={{ fontSize: 13, opacity: 0.85, marginLeft: 8 }}>— {paymentMethod}</span>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Pro section ──────────────────────────────────────────────────────────────
function ProSection() {
  const proWaUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${PRO_WA_MESSAGE}`;
  return (
    <div style={{ background: "linear-gradient(135deg, #1c3d5a, #1f5c3d)", color: T.white, borderRadius: 18, padding: 28, boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24, alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: "bold", letterSpacing: 1.5, opacity: 0.7, marginBottom: 8 }}>ESPACE PROFESSIONNELS</div>
          <h2 style={{ margin: "0 0 14px", fontSize: 26, lineHeight: 1.2 }}>Restaurateurs, épiceries, traiteurs ?</h2>
          <p style={{ fontSize: 14, lineHeight: 1.7, opacity: 0.9, marginBottom: 18 }}>Tarifs professionnels adaptés à vos volumes : livraisons régulières, commandes en gros, approvisionnement sur-mesure.</p>
          <div style={{ display: "grid", gap: 8, marginBottom: 22, fontSize: 14, fontWeight: "bold" }}>
            <div>✅ Prix dégressifs selon les volumes</div>
            <div>✅ Livraisons régulières planifiées</div>
            <div>✅ Produits BIO certifiés</div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            <a href="tel:+33603908935" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: T.white, color: "#1f5c3d", borderRadius: 999, padding: "12px 20px", fontWeight: "bold", textDecoration: "none", fontSize: 14 }}>📞 {PRO_PHONE}</a>
            <a href={proWaUrl} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#25D366", color: T.white, borderRadius: 999, padding: "12px 20px", fontWeight: "bold", textDecoration: "none", fontSize: 14 }}>💬 WhatsApp Pro</a>
          </div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 14, border: "1px solid rgba(255,255,255,0.2)", padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: "bold", marginBottom: 14 }}>Nos clients professionnels :</div>
          {["🍽️ Restaurants africains & caribéens", "🛒 Épiceries exotiques", "👨‍🍳 Traiteurs & cuisiniers à domicile", "🏫 Associations & cantines communautaires"].map((item) => (
            <div key={item} style={{ padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.12)", fontSize: 14 }}>{item}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Payment section (avant formulaire) ──────────────────────────────────────
function PaymentSection() {
  return (
    <div style={card}>
      <SectionTitle emoji="💳" title="Modes de paiement acceptés" subtitle="Choisissez votre mode de paiement à l'étape de confirmation." />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
        {[
          { icon: "🅿️", label: "PayPal",   desc: "Lien automatique — montant pré-rempli", color: "#003087", bg: "#e8f0fe" },
          { icon: "💜", label: "Wero",     desc: "Numéro en surbrillance à copier",        color: "#5b21b6", bg: "#f5f3ff" },
          { icon: "🏦", label: "Virement", desc: "Coordonnées bancaires SEPA",              color: T.green,   bg: T.greenLight },
        ].map((m) => (
          <div key={m.label} style={{ border: `1px solid ${T.border}`, borderRadius: 12, padding: 16, textAlign: "center", background: m.bg }}>
            <div style={{ fontSize: 30, marginBottom: 8 }}>{m.icon}</div>
            <div style={{ fontWeight: "bold", color: m.color, fontSize: 15 }}>{m.label}</div>
            <div style={{ fontSize: 12, color: T.gray, marginTop: 4 }}>{m.desc}</div>
          </div>
        ))}
      </div>
      <div style={{ background: T.greenLight, border: `1px solid ${T.greenBorder}`, borderRadius: 10, padding: 12, marginTop: 14, fontSize: 13, color: T.greenDark }}>
        🔒 Les détails de paiement apparaissent sur la page de confirmation, après validation de votre panier.
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  // ─── Routing simple basé sur window.location.pathname ─────────────────────
  const [currentPage, setCurrentPage] = useState(() => {
    const path = window.location.pathname;
    if (path === "/formations" || path === "/formations/") return "formations";
    return "boutique";
  });

  const navigateTo = (page) => {
    const newPath = page === "formations" ? "/formations" : "/";
    window.history.pushState({}, "", newPath);
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Écoute le bouton retour du navigateur
  useEffect(() => {
    const handlePop = () => {
      const path = window.location.pathname;
      setCurrentPage(path === "/formations" ? "formations" : "boutique");
    };
    window.addEventListener("popstate", handlePop);
    return () => window.removeEventListener("popstate", handlePop);
  }, []);

  // ─── Page Formations ───────────────────────────────────────────────────────
  if (currentPage === "formations") {
    return <Formations onNavigateBoutique={() => navigateTo("boutique")} />;
  }

  // ─── Page Boutique ─────────────────────────────────────────────────────────
  const cart = useCart();
  const [customer,         setCustomer]         = useState({ nom: "", prenom: "", adresse: "", codePostal: "", ville: "", pays: "France" });
  const [countryCode,      setCountryCode]      = useState("+33");
  const [phoneNumber,      setPhoneNumber]      = useState("");
  const [toast,            setToast]            = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const toastTimer = useRef(null);

  const updateCustomer = useCallback((field, value) => setCustomer((prev) => ({ ...prev, [field]: value })), []);
  const showToast = useCallback(() => {
    setToast(true);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(false), 2000);
  }, []);

  const handleAddUnit = useCallback((id) => { cart.updateUnit(id, STEP_KG); showToast(); }, [cart, showToast]);
  const handleAddPack = useCallback((id) => { cart.updatePack(id, 1);      showToast(); }, [cart, showToast]);

  const fullPhone = `${countryCode} ${phoneNumber}`;

  const missingFields = useMemo(() => {
    const fieldsOk = [
      customer.nom.trim().length >= 2,
      customer.prenom.trim().length >= 2,
      customer.adresse.trim().length >= 5,
      /^\d{4,6}$/.test(customer.codePostal.trim()),
      customer.ville.trim().length >= 2,
      customer.pays.trim().length >= 2,
    ].every(Boolean);
    return !fieldsOk || phoneNumber.replace(/\D/g, "").length < 7;
  }, [customer, phoneNumber]);

  if (showConfirmation) {
    return <ConfirmationPage cart={cart} customer={customer} fullPhone={fullPhone} onBack={() => setShowConfirmation(false)} />;
  }

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; font-family: 'Segoe UI', Arial, sans-serif; background: ${T.bg}; color: #1f2937; }
        .layout { display: flex; gap: 28px; max-width: 1380px; margin: 0 auto; padding: 0 16px; align-items: flex-start; }
        .col { flex: 1; min-width: 0; }
        .sticky-cart { display: none !important; }
        .mob-bar { display: flex !important; }
        @media (min-width: 1024px) { .sticky-cart { display: block !important; } .mob-bar { display: none !important; } }
        @media (max-width: 1023px) { .layout { display: block; } }
        input:focus, select:focus { outline: 2px solid ${T.green}; border-color: transparent; }
        button:hover { opacity: 0.9; } button:active { transform: scale(0.97); }
        ::-webkit-scrollbar { height: 4px; } ::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }
      `}</style>

      <Toast show={toast} />
      <FloatingWA />
      <CountdownBanner />

      <header style={{ background: T.green, color: T.white, padding: "15px 16px", position: "sticky", top: 0, zIndex: 30, boxShadow: "0 2px 12px rgba(0,0,0,0.15)" }}>
        <div style={{ maxWidth: 1380, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: "bold", letterSpacing: "-0.3px" }}>LA SERRE AFRICAINE</h1>
            <p style={{ margin: 0, opacity: 0.85, fontSize: 12 }}>Légumes africains BIO cultivés en France 🇫🇷</p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            {cart.subtotal > 0 && <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 999, padding: "8px 14px", fontSize: 14, fontWeight: "bold" }}>🛒 {cart.grandTotal.toFixed(2)} €</div>}
            <button type="button" onClick={() => navigateTo("formations")}
              style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", color: T.white, borderRadius: 999, padding: "10px 18px", fontWeight: "bold", cursor: "pointer", fontSize: 13 }}>
              📚 Formations
            </button>
            <a href="#commande" style={{ background: T.white, color: T.greenDark, borderRadius: 999, padding: "10px 18px", fontWeight: "bold", textDecoration: "none", fontSize: 13 }}>Commander</a>
          </div>
        </div>
      </header>

      <TrustBand />

      {/* Hero */}
      <Section>
        <div style={{ background: `linear-gradient(135deg, ${T.green}, #2f9e44)`, color: T.white, borderRadius: 22, padding: "32px 28px", boxShadow: "0 10px 32px rgba(0,0,0,0.12)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 28, alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: "bold", letterSpacing: 2, opacity: 0.75, marginBottom: 10, textTransform: "uppercase" }}>Agriculture locale · France</div>
              <h2 style={{ marginTop: 0, marginBottom: 12, fontSize: 34, lineHeight: 1.1, fontWeight: "bold" }}>🌱 La Serre Africaine</h2>
              <div style={{ fontSize: 18, fontWeight: "bold", marginBottom: 14, opacity: 0.95 }}>Légumes africains BIO cultivés en France 🇫🇷</div>
              <p style={{ fontSize: 15, lineHeight: 1.75, marginBottom: 18, opacity: 0.9 }}>Frais, naturels, sans pesticides. Du champ à votre assiette, sans intermédiaire.</p>
              <div style={{ display: "grid", gap: 7, marginBottom: 20, fontWeight: "bold", fontSize: 14 }}>
                <div>👉 Livraison Relais offerte dès {FREE_DELIVERY_THRESHOLD} €</div>
                <div>👉 −15% sur vos produits à l'unité dès 5 kg</div>
                <div>👉 Paiement Wero, PayPal ou virement</div>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                <a href="#packs" style={{ background: T.white, color: T.greenDark, borderRadius: 999, padding: "13px 22px", fontWeight: "bold", textDecoration: "none", fontSize: 14 }}>Voir les packs</a>
                <a href="#commande" style={{ background: "rgba(255,255,255,0.15)", color: T.white, border: "1px solid rgba(255,255,255,0.3)", borderRadius: 999, padding: "13px 22px", fontWeight: "bold", textDecoration: "none", fontSize: 14 }}>Commander</a>
              </div>
            </div>
            <img src={serreHeroImg} alt="Serre Africaine" style={{ width: "100%", height: 340, objectFit: "cover", borderRadius: 18, boxShadow: "0 12px 28px rgba(0,0,0,0.2)" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginTop: 22 }}>
            {["✔️ Agriculture locale 🇫🇷","✔️ 100 % BIO 🌱","✔️ Fraîcheur garantie","✔️ −15% dès 5 kg","✔️ Livraison rapide","✔️ Wero & PayPal"].map((r) => (
              <div key={r} style={{ background: "rgba(255,255,255,0.13)", border: "1px solid rgba(255,255,255,0.22)", borderRadius: 10, padding: "9px 12px", fontSize: 12, fontWeight: "bold" }}>{r}</div>
            ))}
          </div>
        </div>
      </Section>

      <div className="layout">
        <div className="col">
          <Section id="packs">
            <div style={card}>
              <SectionTitle emoji="🧺" title="Nos packs" subtitle="Les offres les plus demandées, prêtes à commander." />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 18 }}>
                {PACKS.map((pack) => (
                  <PackCard key={pack.id} pack={pack} qty={cart.packCart[pack.id] || 0}
                    onDecrement={() => cart.updatePack(pack.id, -1)}
                    onIncrement={() => cart.updatePack(pack.id, 1)}
                    onAdd={() => handleAddPack(pack.id)} />
                ))}
              </div>
            </div>
          </Section>

          <Section bg={T.bgAlt}>
            <div style={card}>
              <SectionTitle emoji="🥬" title="Produits à l'unité" subtitle="Par tranche de 0,5 kg — récolte hebdomadaire, livraison fraîche."
                action={<span style={{ background: T.amberLight, color: T.amber, fontWeight: "bold", padding: "7px 14px", borderRadius: 999, fontSize: 13 }}>⚡ −15% dès 5 kg</span>} />
              {cart.totalUnitWeight > 0 && <BulkBanner totalUnitWeight={cart.totalUnitWeight} bulkDiscount={cart.bulkDiscount} />}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
                {PRODUCTS.map((product) => (
                  <ProductCard key={product.id} product={product} qty={cart.unitCart[product.id]}
                    onDecrement={() => cart.updateUnit(product.id, -STEP_KG)}
                    onIncrement={() => cart.updateUnit(product.id, STEP_KG)}
                    onAdd={() => handleAddUnit(product.id)}
                    bulkDiscount={cart.bulkDiscount} />
                ))}
              </div>
            </div>
          </Section>

          <Section>
            <div style={card}>
              <SectionTitle emoji="🚚" title="Tarifs de livraison" subtitle="Via Mondial Relay — calculés selon le poids réel de votre commande." />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 14 }}>
                <div style={{ background: T.greenLight, borderRadius: 12, padding: 16, border: `1px solid ${T.greenBorder}` }}>
                  <div style={{ fontWeight: "bold", color: T.greenDark, marginBottom: 12, fontSize: 14 }}>📦 Point Relais (France)</div>
                  {MR_RELAY_RATES.map((r) => (
                    <div key={r.maxKg} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "4px 0", borderBottom: `1px solid ${T.greenBorder}` }}>
                      <span style={{ color: T.gray }}>jusqu'à {r.maxKg} kg</span><strong>{r.price.toFixed(2)} €</strong>
                    </div>
                  ))}
                  <div style={{ marginTop: 10, fontSize: 12, color: T.greenDark, fontWeight: "bold" }}>🎁 Offerte dès {FREE_DELIVERY_THRESHOLD} € ou avec le Pack Premium</div>
                </div>
                <div style={{ background: T.grayLight, borderRadius: 12, padding: 16, border: `1px solid ${T.border}` }}>
                  <div style={{ fontWeight: "bold", color: T.greenDark, marginBottom: 10, fontSize: 14 }}>🏠 Livraison à domicile</div>
                  <p style={{ color: T.gray, fontSize: 14, marginBottom: 10 }}>Tarif Point Relais + <strong>{MR_HOME_SURCHARGE.toFixed(2)} €</strong> de supplément.</p>
                  <div style={{ background: T.redLight, color: T.red, borderRadius: 8, padding: 10, fontSize: 13, fontWeight: "bold" }}>⚠️ Toujours payante, même au-delà de {FREE_DELIVERY_THRESHOLD} €.</div>
                </div>
              </div>
            </div>
          </Section>

          <Section bg={T.bgAmber}><ProSection /></Section>

          <Section>
            <div style={card}>
              <SectionTitle emoji="❤️" title="Notre engagement" />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 18, alignItems: "center" }}>
                <div>
                  <p style={{ color: T.gray, lineHeight: 1.7, marginBottom: 14 }}>Nous avons créé <strong>La Serre Africaine</strong> avec une vision simple : reconnecter la diaspora à ses racines, proposer une agriculture saine et valoriser les saveurs africaines en Europe.</p>
                  <div style={{ display: "grid", gap: 6, fontWeight: "bold", fontSize: 14 }}>
                    <div>👉 Reconnecter la diaspora à ses racines</div>
                    <div>👉 Agriculture saine et responsable</div>
                    <div>👉 Valoriser les saveurs africaines en Europe</div>
                  </div>
                </div>
                <img src={engagementImg} alt="Engagement" style={{ width: "100%", height: 240, borderRadius: 14, objectFit: "cover" }} />
              </div>
            </div>
          </Section>

          {/* Paiement AVANT le formulaire */}
          <Section bg={T.bgAlt}><PaymentSection /></Section>

          {/* Formulaire + Panier */}
          <Section id="commande" style={{ paddingBottom: 100 }}>
            <div style={{ ...card, marginBottom: 20 }}>
              <SectionTitle emoji="📋" title="Vos informations" subtitle="Tous les champs sont obligatoires." />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
                {[
                  ["nom",        "Nom",         (v) => v.trim().length >= 2],
                  ["prenom",     "Prénom",      (v) => v.trim().length >= 2],
                  ["adresse",    "Adresse",     (v) => v.trim().length >= 5],
                  ["codePostal", "Code postal", (v) => /^\d{4,6}$/.test(v.trim())],
                  ["ville",      "Ville",       (v) => v.trim().length >= 2],
                  ["pays",       "Pays",        (v) => v.trim().length >= 2],
                ].map(([field, ph, validate]) => (
                  <ValidatedInput key={field} placeholder={ph} value={customer[field]} onChange={(v) => updateCustomer(field, v)} validate={validate} />
                ))}
                <PhoneInput countryCode={countryCode} phoneNumber={phoneNumber} onCountryChange={setCountryCode} onPhoneChange={setPhoneNumber} />
              </div>
              {phoneNumber && (
                <div style={{ marginTop: 10, fontSize: 13, color: T.greenDark, fontWeight: "bold" }}>📞 Numéro complet : {fullPhone}</div>
              )}
            </div>
            <div style={card}>
              <SectionTitle emoji="🛒" title="Votre panier" />
              <CartContent cart={cart} onValidate={() => { setShowConfirmation(true); window.scrollTo({ top: 0, behavior: "smooth" }); }} missingFields={missingFields} />
            </div>
          </Section>
        </div>

        {/* Sticky cart */}
        <div className="sticky-cart" style={{ position: "sticky", top: 80, width: 320, flexShrink: 0, background: T.white, borderRadius: 18, border: `1px solid ${T.border}`, boxShadow: "0 8px 24px rgba(0,0,0,0.10)", padding: 20, alignSelf: "flex-start" }}>
          <CartContent cart={cart} onValidate={() => { setShowConfirmation(true); window.scrollTo({ top: 0, behavior: "smooth" }); }} missingFields={missingFields} />
        </div>
      </div>

      {/* Mobile bar */}
      <div className="mob-bar" style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50, background: T.green, color: T.white, padding: "12px 20px", justifyContent: "space-between", alignItems: "center", boxShadow: "0 -4px 20px rgba(0,0,0,0.15)" }}>
        <div>
          <div style={{ fontWeight: "bold", fontSize: 15 }}>🛒 {cart.totalItems > 0 ? `${cart.totalItems} article${cart.totalItems > 1 ? "s" : ""}` : "Panier vide"}</div>
          {cart.subtotal > 0 && <div style={{ fontSize: 12, opacity: 0.85 }}>{cart.grandTotal.toFixed(2)} € total</div>}
        </div>
        <a href="#commande" style={{ background: T.white, color: T.green, borderRadius: 10, padding: "10px 18px", fontWeight: "bold", textDecoration: "none", fontSize: 14 }}>Voir le panier</a>
      </div>

      <section style={{ maxWidth: 1380, margin: "0 auto", padding: "0 16px 60px" }}>
        <div style={{ background: `linear-gradient(135deg, ${T.green}, #2f9e44)`, color: T.white, borderRadius: 22, padding: "32px 28px" }}>
          <h2 style={{ marginTop: 0, fontSize: 28, fontWeight: "bold" }}>⚡ Commandez maintenant</h2>
          <p style={{ fontSize: 16, lineHeight: 1.75, marginBottom: 20, opacity: 0.95 }}>Recevez vos légumes frais chez vous, prêts à cuisiner.</p>
          <a href="#commande" style={{ background: T.white, color: T.greenDark, borderRadius: 999, padding: "14px 26px", fontWeight: "bold", textDecoration: "none", display: "inline-block", fontSize: 15 }}>Commander maintenant</a>
        </div>
      </section>

      <footer style={{ textAlign: "center", color: T.gray, padding: "20px 16px 80px", fontSize: 13 }}>
        Merci de faire grandir <strong>La Serre Africaine</strong>. &nbsp;|&nbsp; Pro : {PRO_PHONE}
      </footer>
    </>
  );
}
