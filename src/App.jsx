import { useEffect, useState } from "react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import imageCompression from "browser-image-compression";

import { db } from "./db";
import { fileToBase64 } from "./utils";

const categories = [
  "法式",
  "复古",
  "婚礼",
  "Lolita",
  "森系",
  "宫廷"
];

const unitOptions = ["码", "米", "厘米"];

function toMeters(length, unit) {

  const n = Number(length) || 0;

  if (unit === "码") return n * 0.9144;

  if (unit === "厘米") return n / 100;

  return n;
}

function formatRMB(v) {

  return `¥${Number(v || 0).toFixed(2)}`;
}

export default function App() {

  const [items, setItems] = useState([]);

  const [keyword, setKeyword] = useState("");

  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    name: "",
    image: "",
    category: "法式",
    width: "",
    length: "",
    unit: "码",
    unitPrice: "",
    totalPrice: "",
    notes: "",
  });

  useEffect(() => {

    loadItems();

  }, []);

  async function loadItems() {

    const data = await db.items
      .orderBy("id")
      .reverse()
      .toArray();

    setItems(data);
  }

  async function addItem() {

    if (!form.name) return;

    await db.items.add({
      ...form,
      createdAt: Date.now()
    });

    resetForm();

    loadItems();
  }

  async function deleteItem(id) {

    await db.items.delete(id);

    loadItems();
  }

  function editItem(item) {

    setForm({
      ...item
    });

    setEditingId(item.id);
  }

  async function saveEdit() {

    if (!form.name) return;

    await db.items.put({
      ...form,
      id: editingId
    });

    setEditingId(null);

    resetForm();

    loadItems();
  }

  function resetForm() {

    setForm({
      name: "",
      image: "",
      category: "法式",
      width: "",
      length: "",
      unit: "码",
      unitPrice: "",
      totalPrice: "",
      notes: "",
    });

    setEditingId(null);
  }

  async function handleImageUpload(e) {

    const file = e.target.files[0];

    if (!file) return;

    try {

      // 图片压缩
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 0.3,
        maxWidthOrHeight: 1200,
        useWebWorker: true
      });

      console.log(
        "原始大小:",
        (file.size / 1024 / 1024).toFixed(2),
        "MB"
      );

      console.log(
        "压缩后:",
        (compressedFile.size / 1024 / 1024).toFixed(2),
        "MB"
      );

      // 转 base64
      const base64 = await fileToBase64(compressedFile);

      setForm(prev => ({
        ...prev,
        image: base64
      }));

    } catch (err) {

      console.error("图片处理失败:", err);

      alert("图片上传失败");
    }
  }

  function handleChange(k, v) {

    const updated = {
      ...form,
      [k]: v
    };

    // 自动计算总价
    if (updated.length && updated.unitPrice) {

      updated.totalPrice =
        Number(updated.length) *
        Number(updated.unitPrice);
    }

    setForm(updated);
  }

  const filtered = items.filter(i =>

    i.name.toLowerCase().includes(keyword.toLowerCase()) ||

    (i.category || "")
      .toLowerCase()
      .includes(keyword.toLowerCase()) ||

    (i.notes || "")
      .toLowerCase()
      .includes(keyword.toLowerCase())
  );

  const totalSpend = filtered.reduce(
    (s, i) => s + Number(i.totalPrice || 0),
    0
  );

  async function exportExcel() {

    const workbook = new ExcelJS.Workbook();

    const sheet = workbook.addWorksheet("采购明细");

    sheet.columns = [
      { header: "图片", key: "image", width: 16 },
      { header: "名称", key: "name", width: 35 },
      { header: "分类", key: "category", width: 14 },
      { header: "幅宽", key: "width", width: 12 },
      { header: "长度", key: "length", width: 12 },
      { header: "折算米", key: "meters", width: 12 },
      { header: "单价", key: "unitPrice", width: 12 },
      { header: "总价", key: "totalPrice", width: 12 },
      { header: "备注", key: "notes", width: 28 },
    ];

    sheet.views = [
      {
        state: "frozen",
        ySplit: 1
      }
    ];

    for (let i = 0; i < filtered.length; i++) {

      const item = filtered[i];

      const row = sheet.addRow({
        name: item.name,
        category: item.category,
        width: item.width,
        length: `${item.length}${item.unit}`,
        meters: toMeters(item.length, item.unit).toFixed(2),
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        notes: item.notes
      });

      row.height = 60;

      if (item.image) {

        const imageId = workbook.addImage({
          base64: item.image,
          extension: "png"
        });

        sheet.addImage(imageId, {
          tl: { col: 0, row: i + 1 },
          ext: { width: 60, height: 60 }
        });
      }
    }

    const buffer = await workbook.xlsx.writeBuffer();

    saveAs(
      new Blob([buffer]),
      "蕾丝采购表.xlsx"
    );
  }

  return (

    <div style={{
      minHeight: "100vh",
      background: "#1a1228",
      color: "#fff",
      padding: 16,
      fontFamily: "sans-serif"
    }}>

      <h1>🎀 蕾丝采购系统</h1>

      {/* 搜索 */}

      <input
        placeholder="搜索蕾丝..."
        value={keyword}
        onChange={e => setKeyword(e.target.value)}
        style={{
          width: "100%",
          padding: 12,
          borderRadius: 10,
          marginBottom: 16,
          boxSizing: "border-box"
        }}
      />

      {/* 表单 */}

      <div style={{
        background: "#2a1f40",
        padding: 16,
        borderRadius: 16,
        marginBottom: 20
      }}>

        <h3>
          {editingId ? "编辑蕾丝" : "新增蕾丝"}
        </h3>

        {/* 名称 */}

        <input
          placeholder="名称"
          value={form.name}
          onChange={e => handleChange("name", e.target.value)}
          style={input}
        />

        {/* 分类 */}

        <select
          value={form.category}
          onChange={e => handleChange("category", e.target.value)}
          style={input}
        >
          {categories.map(c => (
            <option key={c}>{c}</option>
          ))}
        </select>

        {/* 幅宽 */}

        <input
          placeholder="幅宽"
          value={form.width}
          onChange={e => handleChange("width", e.target.value)}
          style={input}
        />

        {/* 长度 */}

        <div style={{
          display: "flex",
          gap: 10
        }}>

          <input
            type="number"
            placeholder="长度"
            value={form.length}
            onChange={e => handleChange("length", e.target.value)}
            style={input}
          />

          <select
            value={form.unit}
            onChange={e => handleChange("unit", e.target.value)}
            style={input}
          >
            {unitOptions.map(u => (
              <option key={u}>{u}</option>
            ))}
          </select>
        </div>

        {/* 单价 */}

        <input
          type="number"
          placeholder="单价"
          value={form.unitPrice}
          onChange={e => handleChange("unitPrice", e.target.value)}
          style={input}
        />

        {/* 总价 */}

        <input
          type="number"
          placeholder="总价"
          value={form.totalPrice}
          onChange={e => handleChange("totalPrice", e.target.value)}
          style={input}
        />

        {/* 备注 */}

        <input
          placeholder="备注"
          value={form.notes}
          onChange={e => handleChange("notes", e.target.value)}
          style={input}
        />

        {/* 图片上传 */}

        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleImageUpload}
          style={{ marginTop: 12 }}
        />

        {/* 图片预览 */}

        {form.image && (

          <img
            src={form.image}
            style={{
              width: 100,
              height: 100,
              objectFit: "cover",
              borderRadius: 10,
              marginTop: 12
            }}
          />
        )}

        {/* 添加/保存按钮 */}

        <button
          onClick={
            editingId
              ? saveEdit
              : addItem
          }
          style={button}
        >
          {editingId
            ? "保存修改"
            : "添加"}
        </button>

      </div>

      {/* 统计 */}

      <div style={{
        marginBottom: 20
      }}>

        <div>
          总款数：{filtered.length}
        </div>

        <div>
          总花费：{formatRMB(totalSpend)}
        </div>

      </div>

      {/* 导出 */}

      <button
        onClick={exportExcel}
        style={{
          ...button,
          background: "#3d8c3d"
        }}
      >
        导出 Excel
      </button>

      {/* 列表 */}

      <div style={{ marginTop: 20 }}>

        {filtered.map(item => (

          <div
            key={item.id}
            style={{
              background: "#241640",
              padding: 14,
              borderRadius: 16,
              marginBottom: 12
            }}
          >

            <div style={{
              display: "flex",
              gap: 14
            }}>

              {/* 图片 */}

              {item.image && (

                <img
                  src={item.image}
                  style={{
                    width: 80,
                    height: 80,
                    objectFit: "cover",
                    borderRadius: 10
                  }}
                />
              )}

              {/* 内容 */}

              <div style={{ flex: 1 }}>

                <div style={{
                  fontSize: 16,
                  fontWeight: 700
                }}>
                  {item.name}
                </div>

                <div style={{
                  color: "#caa8ff",
                  marginTop: 6
                }}>
                  {item.category}
                </div>

                <div style={{
                  marginTop: 6
                }}>
                  {item.length}
                  {item.unit}
                  （
                  {toMeters(item.length, item.unit).toFixed(2)}
                  m）
                </div>

                <div style={{
                  marginTop: 6
                }}>
                  💰 {formatRMB(item.totalPrice)}
                </div>

                <div style={{
                  color: "#aaa",
                  marginTop: 6
                }}>
                  {item.notes}
                </div>

              </div>

              {/* 按钮 */}

              <div style={{
                display: "flex",
                flexDirection: "column",
                gap: 8
              }}>

                <button
                  onClick={() => editItem(item)}
                  style={{
                    background: "#4a3570",
                    color: "#fff",
                    border: "none",
                    borderRadius: 10,
                    padding: "8px 12px",
                    cursor: "pointer"
                  }}
                >
                  编辑
                </button>

                <button
                  onClick={() => deleteItem(item.id)}
                  style={{
                    background: "#662244",
                    color: "#fff",
                    border: "none",
                    borderRadius: 10,
                    padding: "8px 12px",
                    cursor: "pointer"
                  }}
                >
                  删除
                </button>

              </div>

            </div>

          </div>
        ))}

      </div>

    </div>
  );
}

const input = {
  width: "100%",
  padding: 12,
  borderRadius: 10,
  marginTop: 10,
  boxSizing: "border-box"
};

const button = {
  marginTop: 14,
  width: "100%",
  padding: 14,
  border: "none",
  borderRadius: 12,
  background: "#9b6fd4",
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer"
};