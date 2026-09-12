"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function BookingHistoryPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // ดึงข้อมูลประวัติการจองทั้งหมดจาก Supabase เรียงลำดับจากล่าสุดไปเก่าสุด
  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching orders:", error);
    } else {
      setOrders(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // คำนวณยอดขาย/ยอดบริการรวมทั้งหมด
  const totalSales = orders.reduce((sum, item) => sum + Number(item.total_price || 0), 0);

  // แปลงรูปแบบวันเวลาให้อ่านง่าย
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div style={{ padding: "1rem" }}>
      <h2>📜 ประวัติการจองและยอดขายบริการ</h2>

      {/* สรุปยอดขายรวมทั้งหมด */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "#fff",
          padding: "1.5rem",
          borderRadius: "8px",
          boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
          marginTop: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        <div>
          <h3 style={{ margin: 0, color: "#634832" }}>ยอดบริการรวมทั้งหมด</h3>
          <p style={{ margin: 0, color: "#888", fontSize: "0.9rem" }}>
            จำนวนการรายการจองทั้งหมด: {orders.length} รายการ
          </p>
        </div>
        <div style={{ fontSize: "1.8rem", fontWeight: "bold", color: "#8b5a2b" }}>
          ฿{totalSales.toLocaleString()}
        </div>
      </div>

      {/* ตารางแสดงรายการประวัติการจอง */}
      {loading ? (
        <p>กำลังโหลดประวัติการจอง...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>วันเวลาทำรายการ</th>
              <th>ชื่อลูกค้า</th>
              <th>บริการที่เลือก</th>
              <th>วัน/เวลา ที่จอง</th>
              <th>จำนวน (คน/สิทธิ์)</th>
              <th>ยอดรวม (บาท)</th>
              <th>สถานะ</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: "center", padding: "2rem" }}>
                  ยังไม่มีประวัติการทำรายการ
                </td>
              </tr>
            ) : (
              orders.map((item) => (
                <tr key={item.id}>
                  <td>{formatDate(item.created_at)}</td>
                  <td>
                    <strong>{item.customer_name}</strong>
                    {item.customer_phone && (
                      <div style={{ fontSize: "0.8rem", color: "#666" }}>
                        {item.customer_phone}
                      </div>
                    )}
                  </td>
                  <td>{item.service_name}</td>
                  <td>
                    {item.booking_date || "-"} {item.booking_time || ""}
                  </td>
                  <td style={{ textAlign: "center" }}>{item.quantity}</td>
                  <td>
                    <strong>{Number(item.total_price).toLocaleString()}</strong>
                  </td>
                  <td>
                    <span
                      style={{
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "0.85rem",
                        backgroundColor:
                          item.status === "paid" ? "#d4edda" : "#fff3cd",
                        color: item.status === "paid" ? "#155724" : "#856404",
                      }}
                    >
                      {item.status === "paid" ? "ชำระแล้ว" : "รอดำเนินการ"}
                    </span>
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
