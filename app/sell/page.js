"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function BookingPage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  // State สำหรับตะกร้าสินค้า
  const [cart, setCart] = useState([]);

  // State สำหรับข้อมูลลูกค้า
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");

  // ดึงข้อมูลบริการทั้งหมดจาก Supabase
  useEffect(() => {
    const fetchServices = async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .order("category", { ascending: true });

      if (error) {
        console.error("Error fetching services:", error);
      } else {
        setServices(data || []);
      }
      setLoading(false);
    };

    fetchServices();
  }, []);

  // เพิ่มบริการลงตะกร้า
  const addToCart = (service) => {
    const existingIndex = cart.findIndex((item) => item.id === service.id);
    if (existingIndex > -1) {
      const updatedCart = [...cart];
      updatedCart[existingIndex].quantity += 1;
      setCart(updatedCart);
    } else {
      setCart([
        ...cart,
        {
          id: service.id,
          name: service.name,
          price: service.numeric_price || 0,
          priceText: service.price,
          quantity: 1,
        },
      ]);
    }
  };

  // ปรับจำนวนรายการในตะกร้า
  const updateQuantity = (id, delta) => {
    const updatedCart = cart
      .map((item) => {
        if (item.id === id) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      })
      .filter(Boolean);
    setCart(updatedCart);
  };

  // ลบรายการออกจากตะกร้า
  const removeFromCart = (id) => {
    setCart(cart.filter((item) => item.id !== id));
  };

  // คำนวณราคารวมทั้งหมด
  const grandTotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // บันทึกการสั่งซื้อ/จองทั้งหมดลง Supabase
  const handleSubmitBooking = async (e) => {
    e.preventDefault();

    if (cart.length === 0) {
      alert("กรุณาเลือกบริการอย่างน้อย 1 รายการลงในตะกร้า");
      return;
    }

    if (!customerName) {
      alert("กรุณากรอกชื่อลูกค้า");
      return;
    }

    // เตรียมรายการ Insert ทุกรายการลงในตาราง orders
    const ordersToInsert = cart.map((item) => ({
      service_id: item.id,
      service_name: item.name,
      customer_name: customerName,
      customer_phone: customerPhone,
      booking_date: bookingDate || null,
      booking_time: bookingTime || null,
      quantity: item.quantity,
      total_price: item.price * item.quantity,
      status: "pending",
    }));

    const { error } = await supabase.from("orders").insert(ordersToInsert);

    if (error) {
      alert("เกิดข้อผิดพลาดในการบันทึก: " + error.message);
    } else {
      alert("บันทึกการสั่งซื้อ/จองบริการเรียบร้อยแล้ว!");
      setCart([]);
      setCustomerName("");
      setCustomerPhone("");
      setBookingDate("");
      setBookingTime("");
    }
  };

  return (
    <div style={{ padding: "1rem", maxWidth: "1200px", margin: "0 auto" }}>
      {/* 1. สรุปราคารวมตัวใหญ่บนสุด (Top Banner) */}
      <div
        style={{
          backgroundColor: "#8b5a2b",
          color: "#fff",
          padding: "1.5rem 2rem",
          borderRadius: "12px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
          marginBottom: "1.5rem",
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: "1.5rem" }}>Cuddle Club POS 🐾</h1>
          <p style={{ margin: "5px 0 0 0", opacity: 0.9 }}>
            เลือกบริการด้านซ้าย และตรวจสอบรายการสั่งซื้อด้านขวา
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <span style={{ fontSize: "1rem", opacity: 0.9 }}>ยอดรวมสุทธิ</span>
          <div style={{ fontSize: "3rem", fontWeight: "bold", lineHeight: 1 }}>
            ฿{grandTotal.toLocaleString()}
          </div>
        </div>
      </div>

      {/* 2. ส่วนทำงานหลัก 2 คอลัมน์ (แสดงผลพร้อมกันในหน้าเดียว) */}
      {loading ? (
        <p>กำลังโหลดข้อมูลบริการ...</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1.5rem",
            alignItems: "start",
          }}
        >
          {/* ฝั่งซ้าย: รายการบริการทั้งหมด */}
          <div>
            <h3 style={{ marginBottom: "1rem", color: "#634832" }}>
              เลือกบริการ / โปรโมชั่น
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                gap: "10px",
                maxHeight: "650px",
                overflowY: "auto",
                paddingRight: "5px",
              }}
            >
              {services.map((item) => (
                <div
                  key={item.id}
                  style={{
                    backgroundColor: "#fff",
                    border: "1px solid #e2d2c1",
                    borderRadius: "8px",
                    padding: "1rem",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.03)",
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        backgroundColor: "#f7ebe1",
                        color: "#8b5a2b",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        textTransform: "uppercase",
                      }}
                    >
                      {item.category}
                    </span>
                    <h4 style={{ margin: "8px 0 4px 0", fontSize: "1rem" }}>
                      {item.name}
                    </h4>
                    <p style={{ color: "#8b5a2b", fontWeight: "bold", margin: 0 }}>
                      {item.price}
                    </p>
                  </div>
                  <button
                    onClick={() => addToCart(item)}
                    style={{
                      marginTop: "12px",
                      width: "100%",
                      backgroundColor: "#c68b59",
                      color: "#fff",
                      border: "none",
                      padding: "8px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontWeight: "bold",
                    }}
                  >
                    + เพิ่มลงตะกร้า
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* ฝั่งขวา: ตะกร้าสินค้า & ข้อมูลลูกค้า */}
          <div
            style={{
              backgroundColor: "#fff",
              padding: "1.5rem",
              borderRadius: "12px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              border: "1px solid #eee",
            }}
          >
            <h3 style={{ marginBottom: "1rem", color: "#634832" }}>
              🛒 รายการที่เลือก ({cart.length} รายการ)
            </h3>

            {/* ตารางรายการสินค้าในตะกร้า */}
            {cart.length === 0 ? (
              <p
                style={{
                  textAlign: "center",
                  color: "#999",
                  padding: "2rem 0",
                  border: "2px dashed #eee",
                  borderRadius: "8px",
                }}
              >
                ยังไม่มีรายการในตะกร้า กดเลือกบริการด้านซ้ายได้เลย
              </p>
            ) : (
              <div style={{ marginBottom: "1.5rem" }}>
                <table style={{ width: "100%", fontSize: "0.95rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #eee" }}>
                      <th style={{ textAlign: "left", paddingBottom: "8px" }}>รายการ</th>
                      <th style={{ textAlign: "center", paddingBottom: "8px" }}>จำนวน</th>
                      <th style={{ textAlign: "right", paddingBottom: "8px" }}>รวม</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((item) => (
                      <tr key={item.id} style={{ borderBottom: "1px solid #f5f5f5" }}>
                        <td style={{ padding: "8px 0" }}>
                          <strong>{item.name}</strong>
                          <div style={{ fontSize: "0.8rem", color: "#888" }}>
                            @{item.price.toLocaleString()} บาท
                          </div>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            style={{
                              padding: "2px 8px",
                              backgroundColor: "#ddd",
                              color: "#333",
                            }}
                          >
                            -
                          </button>
                          <span style={{ margin: "0 8px", fontWeight: "bold" }}>
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            style={{
                              padding: "2px 8px",
                              backgroundColor: "#ddd",
                              color: "#333",
                            }}
                          >
                            +
                          </button>
                        </td>
                        <td style={{ textAlign: "right", fontWeight: "bold" }}>
                          {(item.price * item.quantity).toLocaleString()}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            style={{
                              backgroundColor: "transparent",
                              color: "#e74c3c",
                              padding: "2px 6px",
                            }}
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ฟอร์มข้อมูลลูกค้าและการจอง */}
            <form onSubmit={handleSubmitBooking}>
              <h4 style={{ marginBottom: "0.8rem", color: "#634832" }}>
                👤 ข้อมูลผู้สั่งซื้อ / จอง
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <input
                  type="text"
                  placeholder="ชื่อลูกค้า *"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                />
                <input
                  type="tel"
                  placeholder="เบอร์โทรศัพท์"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <input
                    type="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                  />
                  <input
                    type="time"
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  disabled={cart.length === 0}
                  style={{
                    marginTop: "10px",
                    padding: "14px",
                    fontSize: "1.1rem",
                    fontWeight: "bold",
                    backgroundColor: cart.length > 0 ? "#8b5a2b" : "#ccc",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    cursor: cart.length > 0 ? "pointer" : "not-allowed",
                  }}
                >
                  ชำระเงิน / ยืนยันการจอง (฿{grandTotal.toLocaleString()})
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
