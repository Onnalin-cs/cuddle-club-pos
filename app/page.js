"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

export default function ServicesPage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  // State สำหรับฟอร์มเพิ่ม/แก้ไขบริการ
  const [formData, setFormData] = useState({
    id: "",
    category: "quick",
    name: "",
    title: "",
    description: "",
    price: "",
    numeric_price: 0,
    image: "",
  });

  const [isEditing, setIsEditing] = useState(false);

  // ดึงข้อมูลบริการทั้งหมดจาก Supabase
  const fetchServices = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching services:", error);
    } else {
      setServices(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchServices();
  }, []);

  // จัดการการพิมพ์ในฟอร์ม
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // บันทึกข้อมูล (เพิ่มใหม่ หรือ แก้ไข)
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isEditing) {
      // แก้ไขข้อมูลบริการเดิม
      const { error } = await supabase
        .from("services")
        .update({
          category: formData.category,
          name: formData.name,
          title: formData.title || formData.name,
          description: formData.description,
          price: formData.price,
          numeric_price: Number(formData.numeric_price) || 0,
          image: formData.image,
        })
        .eq("id", formData.id);

      if (error) alert("แก้ไขข้อมูลไม่สำเร็จ: " + error.message);
      else alert("อัปเดตบริการเรียบร้อย!");
    } else {
      // เพิ่มบริการใหม่
      const { error } = await supabase.from("services").insert([
        {
          id: formData.id,
          category: formData.category,
          name: formData.name,
          title: formData.title || formData.name,
          description: formData.description,
          price: formData.price,
          numeric_price: Number(formData.numeric_price) || 0,
          image: formData.image,
        },
      ]);

      if (error) alert("เพิ่มบริการไม่สำเร็จ: " + error.message);
      else alert("เพิ่มบริการเรียบร้อย!");
    }

    resetForm();
    fetchServices();
  };

  // เลือกบริการมาแก้ไข
  const handleEdit = (service) => {
    setFormData({
      id: service.id,
      category: service.category,
      name: service.name,
      title: service.title || service.name,
      description: service.description || "",
      price: service.price,
      numeric_price: service.numeric_price || 0,
      image: service.image || "",
    });
    setIsEditing(true);
  };

  // ลบบริการ
  const handleDelete = async (id) => {
    if (confirm("คุณต้องการลบบริการนี้ใช่หรือไม่?")) {
      const { error } = await supabase.from("services").delete().eq("id", id);
      if (error) alert("ลบไม่สำเร็จ: " + error.message);
      else fetchServices();
    }
  };

  // รีเซ็ตฟอร์ม
  const resetForm = () => {
    setFormData({
      id: "",
      category: "quick",
      name: "",
      title: "",
      description: "",
      price: "",
      numeric_price: 0,
      image: "",
    });
    setIsEditing(false);
  };

  return (
    <div style={{ padding: "1rem" }}>
      <h2>{isEditing ? "✏️ แก้ไขรายการบริการ" : "➕ เพิ่มบริการ / โปรโมชั่นใหม่"}</h2>

      {/* ฟอร์มจัดการบริการ */}
      <form
        onSubmit={handleSubmit}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "10px",
          backgroundColor: "#fff",
          padding: "1.5rem",
          borderRadius: "8px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
          marginBottom: "2rem",
        }}
      >
        <input
          type="text"
          name="id"
          placeholder="ID บริการ (เช่น quick-pass-1hour)"
          value={formData.id}
          onChange={handleChange}
          disabled={isEditing}
          required
        />
        <select name="category" value={formData.category} onChange={handleChange}>
          <option value="quick">Quick Pass</option>
          <option value="study">Study Pass</option>
          <option value="private">Private Zone</option>
          <option value="workshop">Workshop</option>
          <option value="promo">Promotion</option>
        </select>
        <input
          type="text"
          name="name"
          placeholder="ชื่อบริการ (เช่น Quick Pass 1 ชั่วโมง)"
          value={formData.name}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="price"
          placeholder="ข้อความราคา (เช่น 150 บาท)"
          value={formData.price}
          onChange={handleChange}
          required
        />
        <input
          type="number"
          name="numeric_price"
          placeholder="ตัวเลขราคาคำนวณ (เช่น 150)"
          value={formData.numeric_price}
          onChange={handleChange}
        />
        <input
          type="text"
          name="image"
          placeholder="ชื่อไฟล์รูป (เช่น quick-pass-1hour_2.jpg)"
          value={formData.image}
          onChange={handleChange}
        />
        <input
          type="text"
          name="description"
          placeholder="รายละเอียดบริการ"
          value={formData.description}
          onChange={handleChange}
          style={{ gridColumn: "1 / -1" }}
        />

        <div style={{ gridColumn: "1 / -1", display: "flex", gap: "10px" }}>
          <button type="submit">{isEditing ? "บันทึกการแก้ไข" : "บันทึกบริการ"}</button>
          {isEditing && (
            <button
              type="button"
              onClick={resetForm}
              style={{ backgroundColor: "#888" }}
            >
              ยกเลิก
            </button>
          )}
        </div>
      </form>

      {/* ตารางแสดงรายการบริการ */}
      <h2>🐾 รายการบริการทั้งหมด</h2>
      {loading ? (
        <p style={{ marginTop: "1rem" }}>กำลังโหลดข้อมูล...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>รหัส (ID)</th>
              <th>หมวดหมู่</th>
              <th>ชื่อบริการ</th>
              <th>ราคาแสดงผล</th>
              <th>รายละเอียด</th>
              <th>รูปภาพ</th>
              <th>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {services.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: "center" }}>
                  ยังไม่มีข้อมูลบริการ
                </td>
              </tr>
            ) : (
              services.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.category}</td>
                  <td><strong>{item.name}</strong></td>
                  <td>{item.price}</td>
                  <td>{item.description}</td>
                  <td>{item.image}</td>
                  <td>
                    <button
                      onClick={() => handleEdit(item)}
                      style={{ marginRight: "5px", backgroundColor: "#f39c12" }}
                    >
                      แก้ไข
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      style={{ backgroundColor: "#e74c3c" }}
                    >
                      ลบ
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
