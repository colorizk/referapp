import React, { useState, useEffect, useMemo, useRef } from "react";
import { Plus, ExternalLink, Trash2, Search, Inbox, Link2, CloudOff } from "lucide-react";
import { supabase, supabaseReady } from "./lib/supabaseClient";

// ---------- Design tokens: bright, clean, minimal ----------
const BG = "#FAFAFA";
const SURFACE = "#FFFFFF";
const BORDER = "#EBEBEC";
const INK = "#16171A";
const INK_SOFT = "#8A8F98";
const ACCENT = "#3E63DD";
const ACCENT_SOFT = "#EEF1FD";

const CATEGORY_COLORS = {
  "UI & Web Design": "#3E63DD",
  "Moodboard": "#D24B7A",
  "Typography": "#C7821C",
  "Color & Palette": "#0E9B8A",
  "Illustration & Graphic": "#8452D5",
  "Photography": "#3F9142",
  "Motion & Interaction": "#D9622B",
  "Tools & Kits": "#5B5F73",
  "Uncategorized": "#A6A9B0",
  "Video & Inspiration": "#E0457B"
};
const CATEGORIES = Object.keys(CATEGORY_COLORS);

const KNOWN_SITES = {
  "dribbble.com": "UI & Web Design",
  "behance.net": "UI & Web Design",
  "awwwards.com": "UI & Web Design",
  "siteinspire.com": "UI & Web Design",
  "land-book.com": "UI & Web Design",
  "godly.website": "UI & Web Design",
  "lapa.ninja": "UI & Web Design",
  "mobbin.com": "UI & Web Design",
  "saaslandingpage.com": "UI & Web Design",
  "muz.li": "UI & Web Design",
  "onepagelove.com": "UI & Web Design",
  "pinterest.com": "Moodboard",
  "pin.it": "Moodboard",
  "instagram.com": "Moodboard",
  "are.na": "Moodboard",
  "codepen.io": "Motion & Interaction",
  "codrops.com": "Motion & Interaction",
  "lottiefiles.com": "Motion & Interaction",
  "figma.com": "Tools & Kits",
  "framer.com": "Tools & Kits",
  "webflow.com": "Tools & Kits",
  "notion.so": "Tools & Kits",
  "fonts.google.com": "Typography",
  "typewolf.com": "Typography",
  "fontsinuse.com": "Typography",
  "coolors.co": "Color & Palette",
  "colorhunt.co": "Color & Palette",
  "happyhues.co": "Color & Palette",
  "unsplash.com": "Photography",
  "pexels.com": "Photography",
  "pixabay.com": "Photography",
  "freepik.com": "Illustration & Graphic",
  "icons8.com": "Illustration & Graphic",
  "undraw.co": "Illustration & Graphic",
  "flaticon.com": "Illustration & Graphic",
};

const KEYWORD_RULES = [
  [/typograph|font/, "Typography"],
  [/color|palette|swatch/, "Color & Palette"],
  [/illustrat|icon|graphic|vector|clipart/, "Illustration & Graphic"],
  [/photo|gallery|stock/, "Photography"],
  [/anima|motion|interaction|micro-interaction|lottie/, "Motion & Interaction"],
  [/mood|inspir/, "Moodboard"],
  [/template|plugin|component|kit/, "Tools & Kits"],
  [/ui|ux|web-?design|landing|website|portfolio/, "UI & Web Design"],
];

function normalizeUrl(raw) {
  let u = raw.trim();
  if (!u) return "";
  if (!/^https?:\/\//i.test(u)) u = "https://" + u;
  return u;
}

function guessCategory(url) {
  let domain = "";
  try {
    domain = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Uncategorized";
  }
  if (KNOWN_SITES[domain]) return KNOWN_SITES[domain];
  const hay = url.toLowerCase();
  for (const [re, cat] of KEYWORD_RULES) {
    if (re.test(hay)) return cat;
  }
  return "Uncategorized";
}

function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "เพิ่งเพิ่ม";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} นาทีที่แล้ว`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ชม.ที่แล้ว`;
  const d = Math.floor(h / 24);
  return `${d} วันที่แล้ว`;
}

const STORAGE_KEY = "refs:links";

export default function App() {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saveError, setSaveError] = useState(false);

  const [urlInput, setUrlInput] = useState("");
  const [titleInput, setTitleInput] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [formError, setFormError] = useState("");

  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const urlRef = useRef(null);

  // Load on mount: Supabase if configured, otherwise localStorage
  useEffect(() => {
    (async () => {
      if (supabaseReady) {
        const { data, error } = await supabase
          .from("links")
          .select("*")
          .order("created_at", { ascending: false });
        if (!error && data) {
          setLinks(
            data.map((row) => ({
              id: row.id,
              url: row.url,
              domain: row.domain,
              title: row.title,
              category: row.category,
              tags: row.tags || [],
              createdAt: row.created_at,
            }))
          );
        } else if (error) {
          setSaveError(true);
        }
        setLoading(false);
        return;
      }
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) setLinks(JSON.parse(raw));
      } catch (e) {
        // no saved data yet, or storage unavailable
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function saveLocal(next) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setSaveError(false);
    } catch (e) {
      setSaveError(true);
    }
  }

  async function addEntry(entry) {
    setLinks((prev) => [entry, ...prev]);
    if (supabaseReady) {
      const { error } = await supabase.from("links").insert({
        id: entry.id,
        url: entry.url,
        domain: entry.domain,
        title: entry.title,
        category: entry.category,
        tags: entry.tags,
        created_at: entry.createdAt,
      });
      if (error) setSaveError(true);
      else setSaveError(false);
      return;
    }
    saveLocal([entry, ...links]);
  }

  async function removeEntry(id) {
    const next = links.filter((l) => l.id !== id);
    setLinks(next);
    if (supabaseReady) {
      const { error } = await supabase.from("links").delete().eq("id", id);
      if (error) setSaveError(true);
      else setSaveError(false);
      return;
    }
    saveLocal(next);
  }

  async function updateCategory(id, category) {
    const next = links.map((l) => (l.id === id ? { ...l, category } : l));
    setLinks(next);
    if (supabaseReady) {
      const { error } = await supabase.from("links").update({ category }).eq("id", id);
      if (error) setSaveError(true);
      else setSaveError(false);
      return;
    }
    saveLocal(next);
  }

  function handleAdd(e) {
    e.preventDefault();
    const url = normalizeUrl(urlInput);
    if (!url) {
      setFormError("ใส่ลิงก์ก่อนนะ");
      return;
    }
    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      setFormError("ลิงก์นี้ดูไม่ถูกต้อง ลองใหม่อีกครั้ง");
      return;
    }
    const domain = parsed.hostname.replace(/^www\./, "");
    const category = guessCategory(url);
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .slice(0, 6);

    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      url,
      domain,
      title: titleInput.trim() || domain,
      category,
      tags,
      createdAt: Date.now(),
    };

    addEntry(entry);
    setUrlInput("");
    setTitleInput("");
    setTagsInput("");
    setFormError("");
    urlRef.current?.focus();
  }

  function handleDelete(id) {
    removeEntry(id);
  }

  function handleRecategorize(id, category) {
    updateCategory(id, category);
  }

  const counts = useMemo(() => {
    const c = { All: links.length };
    for (const cat of CATEGORIES) c[cat] = 0;
    for (const l of links) c[l.category] = (c[l.category] || 0) + 1;
    return c;
  }, [links]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return links.filter((l) => {
      if (activeCategory !== "All" && l.category !== activeCategory) return false;
      if (!q) return true;
      return (
        l.title.toLowerCase().includes(q) ||
        l.domain.toLowerCase().includes(q) ||
        l.category.toLowerCase().includes(q) ||
        l.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [links, query, activeCategory]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: BG,
        color: INK,
        fontFamily: "'Inter', 'Noto Sans Thai', -apple-system, sans-serif",
        padding: "40px 24px 64px",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Noto+Sans+Thai:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        .rc-mono { font-family: 'JetBrains Mono', monospace; }
        .rc-card { transition: border-color .12s ease, box-shadow .12s ease; }
        .rc-card:hover { border-color: #D8DCE6; box-shadow: 0 4px 16px rgba(20,20,30,0.06); }
        .rc-card:hover .rc-del { opacity: 1; }
        .rc-del { opacity: 0; transition: opacity .12s ease; }
        .rc-chip { transition: background .12s ease, color .12s ease, border-color .12s ease; }
        .rc-input { transition: border-color .12s ease, box-shadow .12s ease; }
        .rc-input:focus { outline: none; border-color: ${ACCENT} !important; box-shadow: 0 0 0 3px ${ACCENT_SOFT}; }
        .rc-add:hover { background: #2F4FC0 !important; }
        input::placeholder { color: #B4B7BF; }
        select.rc-tag { -webkit-appearance: none; appearance: none; }
        @media (prefers-reduced-motion: reduce) {
          .rc-card, .rc-chip, .rc-del, .rc-input { transition: none !important; }
        }
      `}</style>

      <div style={{ maxWidth: 1040, margin: "0 auto" }}>
        {/* Header */}
        <header style={{ marginBottom: 32, display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 9,
              background: ACCENT,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Link2 size={18} color="#fff" strokeWidth={2.2} />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: "-0.01em" }}>
              คลังเรฟเฟอเรนซ์
            </h1>
            <p style={{ color: INK_SOFT, margin: 0, fontSize: 13.5 }}>
              วางลิงก์ ระบบจัดหมวดให้อัตโนมัติ — {links.length} รายการ
            </p>
          </div>
        </header>

        {/* Add form */}
        <form
          onSubmit={handleAdd}
          style={{
            background: SURFACE,
            border: `1px solid ${BORDER}`,
            borderRadius: 14,
            padding: 16,
            marginBottom: 20,
          }}
        >
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input
              ref={urlRef}
              className="rc-input"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="วางลิงก์ เช่น dribbble.com/shots/..."
              style={{
                flex: "1 1 260px",
                padding: "10px 13px",
                borderRadius: 9,
                border: `1px solid ${BORDER}`,
                background: BG,
                fontSize: 14,
                color: INK,
              }}
            />
            <input
              className="rc-input"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              placeholder="ชื่อ/บันทึกสั้นๆ (ไม่บังคับ)"
              style={{
                flex: "1 1 190px",
                padding: "10px 13px",
                borderRadius: 9,
                border: `1px solid ${BORDER}`,
                background: BG,
                fontSize: 14,
                color: INK,
              }}
            />
            <input
              className="rc-input"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="แท็ก คั่นด้วยจุลภาค"
              style={{
                flex: "1 1 170px",
                padding: "10px 13px",
                borderRadius: 9,
                border: `1px solid ${BORDER}`,
                background: BG,
                fontSize: 14,
                color: INK,
              }}
            />
            <button
              type="submit"
              className="rc-add"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "10px 18px",
                borderRadius: 9,
                border: "none",
                background: ACCENT,
                color: "#fff",
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <Plus size={16} strokeWidth={2.4} /> เพิ่ม
            </button>
          </div>
          {formError && (
            <div style={{ color: "#D24B4B", fontSize: 13, marginTop: 8 }}>{formError}</div>
          )}
          {saveError && (
            <div style={{ color: "#D24B4B", fontSize: 13, marginTop: 8 }}>
              บันทึกไม่สำเร็จ — ตรวจสอบการเชื่อมต่อ Supabase หรือ localStorage ของเบราว์เซอร์
            </div>
          )}
        </form>

        {!supabaseReady && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "#FFF8EB",
              border: "1px solid #F2E0B0",
              color: "#8A6415",
              borderRadius: 10,
              padding: "10px 14px",
              fontSize: 12.5,
              marginBottom: 20,
            }}
          >
            <CloudOff size={14} style={{ flexShrink: 0 }} />
            <span>
              ยังไม่ได้ต่อ Supabase — ตอนนี้เก็บข้อมูลไว้ในเบราว์เซอร์นี้เครื่องเดียว (localStorage)
              ดูวิธีตั้งค่าใน README.md เพื่อให้ซิงค์ข้ามอุปกรณ์ได้
            </span>
          </div>
        )}

        {/* Filters */}
        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            alignItems: "center",
            marginBottom: 22,
          }}
        >
          <div style={{ position: "relative", flex: "0 1 200px" }}>
            <Search
              size={14}
              style={{ position: "absolute", left: 11, top: 10, color: INK_SOFT }}
            />
            <input
              className="rc-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ค้นหา..."
              style={{
                width: "100%",
                padding: "8px 10px 8px 32px",
                borderRadius: 20,
                border: `1px solid ${BORDER}`,
                background: SURFACE,
                fontSize: 13,
                color: INK,
              }}
            />
          </div>
          {["All", ...CATEGORIES].map((cat) => {
            const active = activeCategory === cat;
            const color = cat === "All" ? INK : CATEGORY_COLORS[cat];
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className="rc-chip"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 12px",
                  borderRadius: 20,
                  border: `1px solid ${active ? color : BORDER}`,
                  background: active ? color : SURFACE,
                  color: active ? "#fff" : INK_SOFT,
                  fontSize: 12.5,
                  fontWeight: 500,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {cat !== "All" && (
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: active ? "#fff" : color,
                      flexShrink: 0,
                    }}
                  />
                )}
                {cat === "All" ? "ทั้งหมด" : cat} · {counts[cat] || 0}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ color: INK_SOFT, fontSize: 14, padding: "40px 0" }}>
            กำลังโหลดคลังของคุณ...
          </div>
        ) : visible.length === 0 ? (
          <div
            style={{
              border: `1.5px dashed ${BORDER}`,
              borderRadius: 14,
              padding: "52px 24px",
              textAlign: "center",
              color: INK_SOFT,
            }}
          >
            <Inbox size={26} style={{ marginBottom: 10, opacity: 0.4 }} />
            <div style={{ fontSize: 14 }}>
              {links.length === 0
                ? "ยังไม่มีลิงก์ในคลัง — เริ่มวางลิงก์แรกด้านบนได้เลย"
                : "ไม่พบรายการที่ตรงกับตัวกรองนี้"}
            </div>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
              gap: 12,
            }}
          >
            {visible.map((l) => {
              const color = CATEGORY_COLORS[l.category] || CATEGORY_COLORS.Uncategorized;
              return (
                <div
                  key={l.id}
                  className="rc-card"
                  style={{
                    position: "relative",
                    background: SURFACE,
                    border: `1px solid ${BORDER}`,
                    borderRadius: 12,
                    padding: 14,
                  }}
                >
                  <button
                    onClick={() => handleDelete(l.id)}
                    className="rc-del"
                    title="ลบ"
                    style={{
                      position: "absolute",
                      top: 10,
                      right: 10,
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      color: INK_SOFT,
                      padding: 4,
                    }}
                  >
                    <Trash2 size={14} />
                  </button>

                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <img
                      src={`https://www.google.com/s2/favicons?sz=64&domain=${l.domain}`}
                      alt=""
                      width={16}
                      height={16}
                      style={{ borderRadius: 4, flexShrink: 0 }}
                    />
                    <span
                      className="rc-mono"
                      style={{
                        fontSize: 11,
                        color: INK_SOFT,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {l.domain}
                    </span>
                  </div>

                  <a
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "flex",
                      alignItems: "start",
                      gap: 4,
                      color: INK,
                      textDecoration: "none",
                      fontSize: 14.5,
                      fontWeight: 600,
                      lineHeight: 1.35,
                      marginBottom: 12,
                      paddingRight: 16,
                      letterSpacing: "-0.005em",
                    }}
                  >
                    <span>{l.title}</span>
                    <ExternalLink size={11} style={{ marginTop: 4, flexShrink: 0, opacity: 0.4 }} />
                  </a>

                  {l.tags.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 12 }}>
                      {l.tags.map((t, i) => (
                        <span
                          key={i}
                          style={{
                            fontSize: 10.5,
                            color: INK_SOFT,
                            background: BG,
                            border: `1px solid ${BORDER}`,
                            borderRadius: 6,
                            padding: "2px 7px",
                          }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 8,
                      paddingTop: 10,
                      borderTop: `1px solid ${BORDER}`,
                    }}
                  >
                    <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 6 }}>
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: color,
                          flexShrink: 0,
                        }}
                      />
                      <select
                        className="rc-tag"
                        value={l.category}
                        onChange={(e) => handleRecategorize(l.id, e.target.value)}
                        style={{
                          fontSize: 11.5,
                          fontWeight: 500,
                          color,
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          maxWidth: 150,
                        }}
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                    <span
                      className="rc-mono"
                      style={{ fontSize: 10, color: INK_SOFT, flexShrink: 0 }}
                    >
                      {timeAgo(l.createdAt)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
