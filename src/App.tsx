import { useState, useRef, useEffect } from "react";

const initialData = [
  { id: 1, name: "白色蕾丝花边 A", type: "single", price: 3.5, unit: "meter", totalLength: 5, usedLength: 0, image: null, note: "细腻镂空，适合发圈" },
  { id: 2, name: "粉色双边蕾丝", type: "double", price: 6.0, unit: "meter", totalLength: 3, usedLength: 0, image: null, note: "双边对称，质感好" },
];

const SINGLE_NEEDED = 1.5;
const DOUBLE_NEEDED = 0.75;
const yardToM = (y) => y * 0.9144;
const mToYard = (m) => (m / 0.9144).toFixed(2);
const calcHairbands = (type, remaining) => Math.floor(remaining / (type === "single" ? SINGLE_NEEDED : DOUBLE_NEEDED));

const P = {
  bg: "#fdf6f0", card: "#fff9f5", accent: "#e8a0bf", accent2: "#b5d5c5",
  text: "#3d2c2c", muted: "#9e7b7b", border: "#f0d9d0",
  tag1: "#fce4ec", tag2: "#e8f5e9", danger: "#ff8a80",
};

// ── ImageUpload with camera / gallery buttons ──────────────────────────────
function ImageUpload({ value, onChange }) {
  const galleryRef = useRef();
  const cameraRef = useRef();

const readFile = (file) => {
  if (!file) return;

  const reader = new FileReader();

  reader.onload = (e) => {
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement("canvas");

      const MAX_WIDTH = 600;

      const scale = MAX_WIDTH / img.width;

      canvas.width = MAX_WIDTH;
      canvas.height = img.height * scale;

      const ctx = canvas.getContext("2d");

      ctx.drawImage(
        img,
        0,
        0,
        canvas.width,
        canvas.height
      );

      const compressed =
        canvas.toDataURL(
          "image/jpeg",
          0.7
        );

      onChange(compressed);
    };

    img.src = e.target.result;
  };

  reader.readAsDataURL(file);
};

  return (
    <div style={{ marginBottom: 14 }}>
      {/* preview */}
      <div style={{
        width: "100%", height: 110, borderRadius: 14,
        background: value ? "transparent" : "linear-gradient(135deg,#fce4ec,#f8bbd0)",
        border: `2px dashed ${P.accent}`, overflow: "hidden",
        display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 8, position: "relative",
      }}>
        {value
          ? <img src={value} alt="花边" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <span style={{ fontSize: 13, color: P.muted }}>📷 花边图片预览</span>
        }
        {value && (
          <button onClick={() => onChange(null)}
            style={{ position: "absolute", top: 6, right: 6, background: "#0006", color: "#fff", border: "none", borderRadius: 20, width: 24, height: 24, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            ✕
          </button>
        )}
      </div>
      {/* buttons */}
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => galleryRef.current.click()}
          style={{ flex: 1, padding: "8px 0", borderRadius: 12, border: `1.5px solid ${P.border}`, background: P.bg, color: P.muted, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
          🖼️ 相册
        </button>
        <button onClick={() => cameraRef.current.click()}
          style={{ flex: 1, padding: "8px 0", borderRadius: 12, border: `1.5px solid ${P.border}`, background: P.bg, color: P.muted, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
          📸 拍照
        </button>
      </div>
      {/* hidden inputs */}
      <input ref={galleryRef} type="file" accept="image/*" style={{ display: "none" }}
        onChange={(e) => readFile(e.target.files[0])} />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }}
        onChange={(e) => readFile(e.target.files[0])} />
    </div>
  );
}

// ── Shared form fields used by both Add & Edit modals ─────────────────────
function LaceForm({ form, set }) {
  return (
    <>
      <label style={S.label}>花边名称 *</label>
      <input style={S.input} placeholder="如：白色镂空蕾丝" value={form.name}
        onChange={(e) => set("name", e.target.value)} />
      <label style={S.label}>类型 *</label>
      <select style={S.select} value={form.type} onChange={(e) => set("type", e.target.value)}>
        <option value="single">单边花边（每圈 150cm）</option>
        <option value="double">双边花边（每圈 75cm）</option>
      </select>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div>
          <label style={S.label}>单价（元）</label>
          <input style={S.input} type="number" min="0" step="0.01" placeholder="0.00" value={form.price}
            onChange={(e) => set("price", e.target.value)} />
        </div>
        <div>
          <label style={S.label}>计量单位</label>
          <select style={S.select} value={form.unit} onChange={(e) => set("unit", e.target.value)}>
            <option value="meter">米 (m)</option>
            <option value="yard">码 (yd)</option>
          </select>
        </div>
      </div>
      <label style={S.label}>总长度（{form.unit === "meter" ? "米" : "码"}）*</label>
      <input style={S.input} type="number" min="0" step="0.01" placeholder={form.unit === "meter" ? "如：5" : "如：5.5"}
        value={form.totalLength} onChange={(e) => set("totalLength", e.target.value)} />
      <label style={S.label}>备注</label>
      <input style={S.input} placeholder="颜色、花型、产地等" value={form.note}
        onChange={(e) => set("note", e.target.value)} />
    </>
  );
}

// ── Add Modal ──────────────────────────────────────────────────────────────
function AddModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ name: "", type: "single", price: "", unit: "meter", totalLength: "", note: "", image: null });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const valid = form.name.trim() && form.totalLength;
  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.sheet} onClick={(e) => e.stopPropagation()}>
        <div style={S.sheetHandle} />
        <div style={S.modalTitle}>🌸 添加花边记录</div>
        <div style={S.infoBox}>单边花边每圈 <b>150cm</b>，双边花边每圈 <b>75cm</b></div>
        <ImageUpload value={form.image} onChange={(v) => set("image", v)} />
        <LaceForm form={form} set={set} />
        <div style={S.actionRow}>
          <button style={S.btn("cancel")} onClick={onClose}>取消</button>
          <button style={{ ...S.btn("primary"), opacity: valid ? 1 : 0.5 }}
            onClick={() => { if (valid) { onAdd({ ...form, id: Date.now(), price: parseFloat(form.price) || 0, totalLength: parseFloat(form.totalLength) || 0, usedLength: 0 }); onClose(); } }}>
            ✓ 添加
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Edit Modal ─────────────────────────────────────────────────────────────
function EditModal({ item, onClose, onSave }) {
  const [form, setForm] = useState({ ...item, price: String(item.price), totalLength: String(item.totalLength), usedLength: String(item.usedLength) });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const valid = form.name.trim() && form.totalLength;
  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.sheet} onClick={(e) => e.stopPropagation()}>
        <div style={S.sheetHandle} />
        <div style={S.modalTitle}>✏️ 编辑花边记录</div>
        <ImageUpload value={form.image} onChange={(v) => set("image", v)} />
        <LaceForm form={form} set={set} />
        <label style={S.label}>已使用（米）</label>
        <input style={S.input} type="number" min="0" step="0.01" value={form.usedLength}
          onChange={(e) => set("usedLength", e.target.value)} />
        <div style={S.actionRow}>
          <button style={S.btn("cancel")} onClick={onClose}>取消</button>
          <button style={{ ...S.btn("primary"), opacity: valid ? 1 : 0.5 }}
            onClick={() => { if (valid) { onSave({ ...form, price: parseFloat(form.price) || 0, totalLength: parseFloat(form.totalLength) || 0, usedLength: parseFloat(form.usedLength) || 0 }); onClose(); } }}>
            ✓ 保存
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Delete Confirm Dialog ──────────────────────────────────────────────────
function DeleteConfirm({ item, onClose, onConfirm }) {
  return (
    <div style={{ ...S.overlay, alignItems: "center", padding: 24 }} onClick={onClose}>
      <div style={{ background: P.card, borderRadius: 20, padding: "24px 20px", width: "100%", maxWidth: 340 }}
        onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize: 36, textAlign: "center", marginBottom: 8 }}>🗑️</div>
        <div style={{ fontSize: 16, fontWeight: 700, textAlign: "center", marginBottom: 6, color: P.text }}>
          确认删除？
        </div>
        <div style={{ fontSize: 13, color: P.muted, textAlign: "center", marginBottom: 20 }}>
          将删除「{item.name}」的所有记录，无法恢复
        </div>
        <div style={S.actionRow}>
          <button style={S.btn("cancel")} onClick={onClose}>取消</button>
          <button style={{ ...S.btn("danger") }} onClick={() => { onConfirm(item.id); onClose(); }}>删除</button>
        </div>
      </div>
    </div>
  );
}

// ── Use Modal ──────────────────────────────────────────────────────────────
function UseModal({ item, onClose, onUse }) {
  const [bands, setBands] = useState(1);
  const needed = item.type === "single" ? SINGLE_NEEDED : DOUBLE_NEEDED;
  const totalInM = item.unit === "yard" ? yardToM(item.totalLength) : item.totalLength;
  const remaining = Math.max(0, totalInM - item.usedLength);
  const max = Math.floor(remaining / needed);
  const useLengthM = bands * needed;
  return (
    <div style={{ ...S.overlay, alignItems: "center", padding: 20 }} onClick={onClose}>
      <div style={{ background: P.card, borderRadius: 20, padding: "24px 20px", width: "100%", maxWidth: 340 }}
        onClick={(e) => e.stopPropagation()}>
        <div style={S.modalTitle}>✂️ 使用花边</div>
        <div style={{ fontSize: 13, color: P.muted, textAlign: "center", marginBottom: 12 }}>{item.name}</div>
        <div style={{ ...S.infoBox, textAlign: "center" }}>
          可制作：<span style={{ fontSize: 28, fontWeight: 800, color: P.accent }}>{max}</span> 个发圈<br />
          <span style={{ fontSize: 12 }}>剩余 {(remaining * 100).toFixed(0)}cm / 每圈 {(needed * 100).toFixed(0)}cm</span>
        </div>
        <label style={S.label}>本次制作数量</label>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <button style={{ ...S.btn("cancel"), flex: 0, width: 42, padding: 0, height: 42, borderRadius: 12, fontSize: 20 }}
            onClick={() => setBands(Math.max(1, bands - 1))}>−</button>
          <div style={{ flex: 1, textAlign: "center", fontSize: 28, fontWeight: 800, color: P.accent }}>{bands}</div>
          <button style={{ ...S.btn("primary"), flex: 0, width: 42, padding: 0, height: 42, borderRadius: 12, fontSize: 20 }}
            onClick={() => setBands(Math.min(max, bands + 1))}>+</button>
        </div>
        <div style={{ fontSize: 12, color: P.muted, textAlign: "center", marginBottom: 16 }}>
          消耗 {(useLengthM * 100).toFixed(0)}cm {item.unit === "yard" ? `≈ ${mToYard(useLengthM)}码` : ""}
        </div>
        <div style={S.actionRow}>
          <button style={S.btn("cancel")} onClick={onClose}>取消</button>
          <button style={{ ...S.btn("use"), opacity: max === 0 ? 0.4 : 1 }}
            onClick={() => { if (bands <= max && max > 0) { onUse(item.id, useLengthM); onClose(); } }}
            disabled={max === 0}>✂️ 确认</button>
        </div>
      </div>
    </div>
  );
}

// ── Lace Card ──────────────────────────────────────────────────────────────
function LaceCard({ item, onDelete, onEdit, onUse }) {
  const totalInM = item.unit === "yard" ? yardToM(item.totalLength) : item.totalLength;
  const remaining = Math.max(0, totalInM - item.usedLength);
  const usedPct = Math.min(100, (item.usedLength / (totalInM || 1)) * 100);
  const bands = calcHairbands(item.type, remaining);

  return (
    <div style={S.card}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        {/* image */}
        <div style={{ width: 64, height: 64, borderRadius: 14, border: `2px dashed ${P.accent}`, overflow: "hidden", flexShrink: 0, background: "linear-gradient(135deg,#fce4ec,#f8bbd0)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>
          {item.image ? <img src={item.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "🎀"}
        </div>
        {/* meta */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</div>
          <span style={S.tag(item.type)}>{item.type === "single" ? "单边" : "双边"}</span>
          <div style={{ display: "flex", gap: 10, fontSize: 12, color: P.muted, flexWrap: "wrap", marginTop: 2 }}>
            <span>💰 ¥{item.price}/{item.unit === "meter" ? "米" : "码"}</span>
            <span>📏 {item.totalLength}{item.unit === "meter" ? "m" : "yd"}</span>
          </div>
          {item.note && <div style={{ fontSize: 11, color: P.muted, marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>📝 {item.note}</div>}
        </div>
        {/* edit icon */}
        <button onClick={() => onEdit(item)}
          style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: P.muted, padding: "0 2px", lineHeight: 1 }}>✏️</button>
      </div>

      {/* progress */}
      <div style={{ height: 5, borderRadius: 5, background: `linear-gradient(90deg, ${P.accent} ${usedPct}%, ${P.border} ${usedPct}%)`, margin: "10px 0 3px" }} />
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: P.muted }}>
        <span>已用 {(item.usedLength * 100).toFixed(0)}cm</span>
        <span>剩余 {(remaining * 100).toFixed(0)}cm</span>
      </div>

      {/* hairband badge */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, background: "linear-gradient(90deg,#fce4ec,#f8bbd0)", borderRadius: 12, padding: "7px 12px" }}>
        <span style={{ fontSize: 18 }}>🎀</span>
        <span style={{ fontSize: 24, fontWeight: 800, color: P.accent, lineHeight: 1 }}>{bands}</span>
        <span style={{ fontSize: 12, color: P.muted }}>个发圈（每圈 {item.type === "single" ? "150" : "75"}cm）</span>
        {item.unit === "yard" && <span style={{ marginLeft: "auto", fontSize: 11, color: P.muted }}>≈{mToYard(remaining)}yd</span>}
      </div>

      {/* actions */}
      <div style={S.actionRow}>
        <button style={S.btn("use")} onClick={() => onUse(item)}>✂️ 使用</button>
        <button style={S.btn("edit")} onClick={() => onEdit(item)}>✏️ 编辑</button>
        <button style={S.btn("danger")} onClick={() => onDelete(item)}>🗑️ 删除</button>
      </div>
    </div>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const S = {
  label: { fontSize: 13, color: P.muted, marginBottom: 4, display: "block", fontWeight: 600, letterSpacing: 0.5 },
  input: { width: "100%", boxSizing: "border-box", padding: "9px 12px", borderRadius: 12, border: `1.5px solid ${P.border}`, fontSize: 14, color: P.text, background: P.bg, marginBottom: 12, fontFamily: "inherit", outline: "none" },
  select: { width: "100%", boxSizing: "border-box", padding: "9px 12px", borderRadius: 12, border: `1.5px solid ${P.border}`, fontSize: 14, color: P.text, background: P.bg, marginBottom: 12, fontFamily: "inherit", outline: "none", appearance: "none" },
  actionRow: { display: "flex", gap: 8, marginTop: 10 },
  btn: (v) => ({
    flex: 1, padding: "8px 0", borderRadius: 12, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 600, transition: "opacity 0.15s",
    background: v === "primary" ? `linear-gradient(90deg,${P.accent},#c9b1d9)` : v === "use" ? `linear-gradient(90deg,${P.accent2},#a8d5ba)` : v === "danger" ? `linear-gradient(90deg,#ff8a80,#ff5252)` : v === "edit" ? `linear-gradient(90deg,#ffe082,#ffb74d)` : P.border,
    color: v === "cancel" ? P.muted : "#fff",
  }),
  card: { background: P.card, borderRadius: 18, padding: "14px 14px 10px", marginBottom: 14, boxShadow: "0 2px 12px #e8a0bf22", border: `1px solid ${P.border}` },
  tag: (t) => ({ display: "inline-block", fontSize: 11, padding: "2px 10px", borderRadius: 20, background: t === "single" ? P.tag1 : P.tag2, color: t === "single" ? "#c2185b" : "#2e7d32", fontWeight: 600, marginBottom: 4, marginRight: 5 }),
  overlay: { position: "fixed", inset: 0, background: "#0008", zIndex: 300, display: "flex", alignItems: "flex-end" },
  sheet: { background: P.card, borderRadius: "24px 24px 0 0", padding: "12px 18px 32px", width: "100%", maxHeight: "92vh", overflowY: "auto", boxSizing: "border-box" },
  sheetHandle: { width: 40, height: 4, borderRadius: 4, background: P.border, margin: "0 auto 16px" },
  modalTitle: { fontSize: 17, fontWeight: 700, marginBottom: 14, textAlign: "center", color: P.text, letterSpacing: 1 },
  infoBox: { background: "linear-gradient(135deg,#fce4ec55,#f8bbd022)", border: `1px solid ${P.border}`, borderRadius: 12, padding: "10px 14px", marginBottom: 14, fontSize: 13, color: P.text },
  summaryCard: { background: "linear-gradient(135deg,#fce4ec,#e8f5e9)", borderRadius: 18, padding: "16px 18px", marginBottom: 14, border: `1px solid ${P.border}` },
};

// ── App ────────────────────────────────────────────────────────────────────
export default function App() {
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem("lace_inventory");
    return saved ? JSON.parse(saved) : initialData;
});
  const [tab, setTab] = useState("inventory");
  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [useTarget, setUseTarget] = useState(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    localStorage.setItem(
      "lace_inventory",
      JSON.stringify(items)
    );
  }, [items]);

  const addItem = (item) => setItems(p => [...p, item]);
  const saveItem = (updated) => setItems(p => p.map(i => i.id === updated.id ? updated : i));
  const deleteItem = (id) => setItems(p => p.filter(i => i.id !== id));
  const useItem = (id, usedM) => setItems(p => p.map(i => {
    if (i.id !== id) return i;
    const totalInM = i.unit === "yard" ? yardToM(i.totalLength) : i.totalLength;
    return { ...i, usedLength: Math.min(i.usedLength + usedM, totalInM) };
  }));

  const filtered = filter === "all" ? items : items.filter(i => i.type === filter);
  const totalBands = items.reduce((s, i) => {
    const t = i.unit === "yard" ? yardToM(i.totalLength) : i.totalLength;
    return s + calcHairbands(i.type, Math.max(0, t - i.usedLength));
  }, 0);
  const totalValue = items.reduce((s, i) => {
    const t = i.unit === "yard" ? yardToM(i.totalLength) : i.totalLength;
    return s + t * i.price;
  }, 0);

  const tabStyle = (active) => ({
    flex: 1, padding: "8px 0", borderRadius: 20, border: "none",
    background: active ? P.accent : P.border, color: active ? "#fff" : P.muted,
    fontWeight: active ? 700 : 400, fontSize: 14, cursor: "pointer", fontFamily: "inherit", letterSpacing: 1,
  });

  return (
    <div style={{ fontFamily: "'Noto Serif SC','Georgia',serif", background: P.bg, minHeight: "100vh", maxWidth: 430, margin: "0 auto", paddingBottom: 90, color: P.text }}>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#f8c8d4 0%,#e8a0bf 60%,#c9b1d9 100%)", padding: "28px 20px 18px", textAlign: "center", borderRadius: "0 0 32px 32px", boxShadow: "0 4px 20px #e8a0bf44", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: "#fff", letterSpacing: 2, margin: 0 }}>🎀 蕾丝花边库存</div>
        <div style={{ fontSize: 12, color: "#fff9", marginTop: 4, letterSpacing: 1 }}>发圈制作助手</div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, padding: "12px 16px 0" }}>
        <button style={tabStyle(tab === "inventory")} onClick={() => setTab("inventory")}>库存</button>
        <button style={tabStyle(tab === "summary")} onClick={() => setTab("summary")}>汇总</button>
      </div>

      {/* Inventory Tab */}
      {tab === "inventory" && (
        <div style={{ padding: "16px 14px 0" }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            {[["all", "全部"], ["single", "单边"], ["double", "双边"]].map(([f, l]) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  ...tabStyle(filter === f),
                  flex: "none",
                  padding: "5px 16px",
                  fontSize: 12,
                }}
              >
                {l}
              </button>
            ))}
          </div>
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", color: P.muted, padding: "50px 0", fontSize: 15 }}>
              🌸 暂无记录，点击 ＋ 添加
            </div>
          )}
          {filtered.map(item => (
            <LaceCard key={item.id} item={item}
              onDelete={() => setDeleteTarget(item)}
              onEdit={() => setEditTarget(item)}
              onUse={() => setUseTarget(item)} />
          ))}
        </div>
      )}

      {/* Summary Tab */}
      {tab === "summary" && (
        <div style={{ padding: "16px 14px 0" }}>
          <div style={S.summaryCard}>
            <div style={{ fontSize: 12, color: P.muted, fontWeight: 600, marginBottom: 6, letterSpacing: 1 }}>🎀 合计可制作发圈</div>
            <div style={{ fontSize: 36, fontWeight: 800, color: P.accent, lineHeight: 1.1 }}>{totalBands} <span style={{ fontSize: 14, color: P.muted }}>个</span></div>
          </div>
          <div style={S.summaryCard}>
            <div style={{ fontSize: 12, color: P.muted, fontWeight: 600, marginBottom: 6, letterSpacing: 1 }}>💰 花边库存总价值</div>
            <div style={{ fontSize: 36, fontWeight: 800, color: P.accent2, lineHeight: 1.1 }}>¥{totalValue.toFixed(2)}</div>
          </div>
          <div style={S.infoBox}>
            <b>制作规则</b><br />
            🎀 单边花边：每发圈 <b>150cm (1.5m)</b><br />
            🎀 双边花边：每发圈 <b>75cm (0.75m)</b><br /><br />
            <b>库存明细</b>
            {items.map(item => {
              const t = item.unit === "yard" ? yardToM(item.totalLength) : item.totalLength;
              const rem = Math.max(0, t - item.usedLength);
              return (
                <div key={item.id} style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${P.border}` }}>
                  <b>{item.name}</b> <span style={S.tag(item.type)}>{item.type === "single" ? "单边" : "双边"}</span><br />
                  <span style={{ fontSize: 12, color: P.muted }}>
                    剩余 {(rem * 100).toFixed(0)}cm → 可做 <b style={{ color: P.accent }}>{calcHairbands(item.type, rem)}</b> 个发圈
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* FAB */}
      <button onClick={() => setShowAdd(true)}
        style={{ position: "fixed", bottom: 24, right: 20, width: 56, height: 56, borderRadius: 28, background: `linear-gradient(135deg,${P.accent},#c9b1d9)`, border: "none", color: "#fff", fontSize: 28, boxShadow: "0 4px 20px #e8a0bf88", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }}>
        ＋
      </button>

      {/* Modals */}
      {showAdd && <AddModal onClose={() => setShowAdd(false)} onAdd={addItem} />}
      {editTarget && <EditModal item={editTarget} onClose={() => setEditTarget(null)} onSave={saveItem} />}
      {deleteTarget && <DeleteConfirm item={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={deleteItem} />}
      {useTarget && <UseModal item={useTarget} onClose={() => setUseTarget(null)} onUse={useItem} />}
    </div>
  );
}