"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function BookingPage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  // State สำหรับฟอร์มการจองบริการ
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [selectedService, setSelectedService] = useState(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [quantity, setQuantity] = useState(1);

  // ดึงข้อมูลบริการทั้งหมดจาก Supabase มาใส่ใน Dropdown
  useEffect(() => {
    const fetchServices = async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .order("name", { ascending: true });

      if (error) {
        console.error("Error fetching services:", error);
      } else {
        setServices(data || []);
      }
      setLoading(false);
    };

    fetchServices();
  }, []);

  // เมื่อเลือกบริการ ให้ดึงข้อมูลบริการนั้นมาเก็บไว้เพื่อคำนวณราคา
  const handleServiceChange = (e) => {
    const id = e.target.value;
    setSelectedServiceId(id);
    const service = services.find((item) => item.id === id);
    setSelectedService(service || null);
  };

  // คำนวณราคารวม (ราคาต่อหน่วย x จำนวน)
  const calculateTotal = () => {
    if (!selectedService) return 0;
    return (selectedService.numeric_price || 0) * quantity;
  };

  // บันทึกการจองบริการ
  const handleSubmitBooking = async (e) => {
    e.preventDefault();

    if (!selectedService) {
      alert("กรุณาเลือกบริการที่ต้องการจอง");
      return;
    }

    if (quantity <= 0) {
      alert("จำนวนผู้ใช้บริการต้องมากกว่า 0 คน");
      return;
    }

    const totalPrice = calculateTotal();

    // 1. บันทึกข้อมูลลงตาราง orders
    const { error: orderError } = await supabase.from("orders").insert([
      {
        service_id: selectedService.id,
        service_name: selectedService.name,
        customer_name: customerName,
        customer_phone: customerPhone,
        booking_date: bookingDate || null,
        booking_time: bookingTime || null,
        quantity: parseInt(quantity),
        total_price: totalPrice,
        status: "pending",
      },
    ]);

    if (orderError) {
      alert("เกิดข้อผิดพลาดในการบันทึกการจอง: " + orderError.message);
      return;
    }

    // 2. แสดงข้อความสำเร็จและรีเซ็ตฟอร์ม
    alert("บันทึกการจองบริการเรียบร้อยแล้ว!");
    setSelectedServiceId("");
    setSelectedService(null);
    setCustomerName("");
    setCustomerPhone("");
    setBookingDate("");
    setBookingTime("");
    setQuantity(1);
  };

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "1rem" }}>
      <h2>📝 บันทึกการจองบริการ (Booking POS)</h2>

      {loading ? (
        <p style={{ marginTop: "1rem" }}>กำลังโหลดข้อมูลบริการ...</p>
      ) : (
        <form
          onSubmit={handleSubmitBooking}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "15px",
            backgroundColor: "#fff",
            padding: "2rem",
            borderRadius: "8px",
            boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
            marginTop: "1rem",
          }}
        >
          {/* เลือกบริการ */}
          <div>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
              เลือกบริการ / โปรโมชั่น:
            </label>
            <select
              value={selectedServiceId}
              onChange={handleServiceChange}
              required
              style={{ width: "100%" }}
            >
              <option value="">-- กรุณาเลือกบริการ --</option>
              {services.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.price})
                </option>
              ))}
            </select>
          </div>

          {/* ข้อมูลลูกค้า */}
          <div>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
              ชื่อลูกค้า:
            </label>
            <input
              type="text"
              placeholder="กรอกชื่อลูกค้า"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
              style={{ width: "100%" }}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
              เบอร์โทรศัพท์:
            </label>
            <input
              type="tel"
              placeholder="กรอกเบอร์โทรศัพท์"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              style={{ width: "100%" }}
            />
          </div>

          {/* วันและเวลาที่เข้าใช้บริการ */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                วันที่ใช้บริการ:
              </label>
              <input
                type="date"
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                style={{ width: "100%" }}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
                เวลา:
              </label>
              <input
                type="time"
                value={bookingTime}
                onChange={(e) => setBookingTime(e.target.value)}
                style={{ width: "100%" }}
              />
            </div>
          </div>

          {/* จำนวนสิทธิ์ / คน */}
          <div>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
              จำนวน (คน/สิทธิ์):
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
              style={{ width: "100%" }}
            />
          </div>

          {/* สรุปยอดเงิน */}
          <div
            style={{
              padding: "1rem",
              backgroundColor: "#f7ebe1",
              borderRadius: "6px",
              textAlign: "right",
              marginTop: "10px",
            }}
          >
            <span style={{ fontSize: "1.1rem" }}>ราคารวมทั้งหมด: </span>
            <strong style={{ fontSize: "1.5rem", color: "#8b5a2b" }}>
              {calculateTotal().toLocaleString()} บาท
            </strong>
          </div>

          {/* ปุ่มยืนยัน */}
          <button
            type="submit"
            style={{
              padding: "12px",
              fontSize: "1rem",
              backgroundColor: "#8b5a2b",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            ยืนยันการจองบริการ
          </button>
        </form>
      )}
    </div>
  );
}
