'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient'; // ปรับ path ตามโครงสร้างโปรเจกต์ของคุณ

export default function SellPage() {
  const [services, setServices] = useState([]);
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [loading, setLoading] = useState(false);

  // ดึงข้อมูลบริการจาก Supabase
  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    const { data, error } = await supabase.from('services').select('*');
    if (error) {
      console.error('Error fetching services:', error);
    } else {
      setServices(data || []);
    }
  };

  // เพิ่มสินค้าลงตะกร้า
  const addToCart = (service) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === service.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === service.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...service, quantity: 1 }];
    });
  };

  // ปรับจำนวนสินค้าในตะกร้า
  const updateQuantity = (id, delta) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  // คำนวณราคารวมสุทธิ
  const totalPrice = cart.reduce(
    (sum, item) => sum + (item.numeric_price || item.price || 0) * item.quantity,
    0
  );

  // ฟังก์ชันส่งข้อความแจ้งเตือนเข้า Telegram
  const sendTelegramNotification = async (orderData) => {
    const botToken = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN;
    const chatId = process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      console.warn('Telegram Bot Token or Chat ID is missing in environment variables.');
      return;
    }

    // แปลงรายการในตะกร้าให้อยู่ในรูปแบบรายการบรรทัด
    const itemListText = orderData.items
      .map((item) => `- ${item.name} x${item.quantity} (${item.price * item.quantity} บาท)`)
      .join('\n');

    const currentTimestamp = new Date().toLocaleString('th-TH', {
      timeZone: 'Asia/Bangkok',
    });

    // ข้อความแจ้งเตือนรูปแบบ HTML
    const message = `🐶 <b>มีรายการจองบริการใหม่! (Cuddle Club POS)</b>
• <b>ชื่อลูกค้า:</b> ${orderData.customerName}
• <b>เบอร์โทรศัพท์:</b> ${orderData.customerPhone}
• <b>วัน/เวลาที่จอง:</b> ${orderData.bookingDate} ${orderData.bookingTime}
• <b>รายการบริการที่เลือก:</b>
${itemListText}
• <b>ยอดรวมสุทธิ:</b> ${orderData.totalPrice} บาท
• <b>ทำรายการเมื่อ:</b> ${currentTimestamp}`;

    try {
      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'HTML',
        }),
      });

      const result = await response.json();
      if (!result.ok) {
        console.error('Telegram API Error:', result.description);
      }
    } catch (err) {
      console.error('Failed to send Telegram notification:', err);
      // แสดง alert แจ้งเตือนข้อผิดพลาดฝั่ง Telegram แต่ไม่บล็อกกระบวนการขาย
      alert('บันทึกการจองสำเร็จ แต่ระบบไม่สามารถส่งแจ้งเตือนเข้า Telegramได้');
    }
  };

  // ฟังก์ชันยืนยันการจอง / ชำระเงิน
  const handleCheckout = async () => {
    if (cart.length === 0) return alert('กรุณาเลือกบริการอย่างน้อย 1 รายการ');
    if (!customerName || !customerPhone || !bookingDate || !bookingTime) {
      return alert('กรุณากรอกข้อมูลลูกค้าและวันเวลาที่จองให้ครบถ้วน');
    }

    setLoading(true);

    try {
      // 1. เตรียมรายการข้อมูลลงตาราง orders
      const ordersToInsert = cart.map((item) => ({
        service_id: item.id,
        service_name: item.name,
        customer_name: customerName,
        customer_phone: customerPhone,
        booking_date: bookingDate,
        booking_time: bookingTime,
        quantity: item.quantity,
        total_price: (item.numeric_price || item.price || 0) * item.quantity,
        status: 'pending',
      }));

      // 2. บันทึกลง Supabase
      const { error } = await supabase.from('orders').insert(ordersToInsert);

      if (error) {
        throw error;
      }

      // 3. รวบรวมข้อมูลเพื่อส่ง Telegram Notification
      const orderSummary = {
        customerName,
        customerPhone,
        bookingDate,
        bookingTime,
        totalPrice,
        items: cart.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.numeric_price || item.price || 0,
        })),
      };

      await sendTelegramNotification(orderSummary);

      alert('บันทึกการจองบริการเรียบร้อยแล้ว!');

      // รีเซ็ตฟอร์มและตะกร้าสินค้า
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setBookingDate('');
      setBookingTime('');
    } catch (error) {
      console.error('Error saving order:', error);
      alert(`เกิดข้อผิดพลาดในการบันทึกข้อมูล: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcf8f2] p-6 text-gray-800">
      {/* Header Banner */}
      <div className="bg-[#8b5a2b] text-white p-6 rounded-2xl shadow-lg flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Cuddle Club POS 🐾</h1>
          <p className="text-sm opacity-90">เลือกบริการด้านซ้าย และตรวจสอบรายการสั่งซื้อด้านขวา</p>
        </div>
        <div className="text-right">
          <span className="text-sm block opacity-80">ยอดรวมสุทธิ</span>
          <span className="text-4xl font-extrabold">฿{totalPrice.toLocaleString()}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ฝั่งซ้าย: รายการบริการ */}
        <div className="lg:col-span-7">
          <h2 className="text-xl font-bold mb-4">เลือกบริการ / โปรโมชั่น</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {services.map((service) => (
              <div key={service.id} className="bg-white p-4 rounded-xl shadow-sm border border-amber-100 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-semibold bg-amber-100 text-amber-800 px-2 py-1 rounded-md uppercase">
                    {service.category || 'Service'}
                  </span>
                  <h3 className="font-bold text-lg mt-2">{service.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{service.description}</p>
                </div>
                <div className="mt-4 flex justify-between items-center">
                  <span className="font-bold text-amber-900">
                    {service.numeric_price ? `${service.numeric_price} บาท` : service.price}
                  </span>
                  <button
                    onClick={() => addToCart(service)}
                    className="bg-[#c88a4b] hover:bg-[#b0753a] text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition"
                  >
                    + เพิ่มลงตะกร้า
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ฝั่งขวา: ตะกร้าสินค้า และ ฟอร์มข้อมูลลูกค้า */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl shadow-sm border border-amber-100 h-fit">
          <h2 className="text-xl font-bold mb-4">🛒 รายการที่เลือก ({cart.length} รายการ)</h2>

          {/* ตารางรายการสินค้า */}
          {cart.length === 0 ? (
            <p className="text-gray-400 text-center py-6">ยังไม่มีรายการในตะกร้า</p>
          ) : (
            <div className="space-y-3 mb-6 max-h-60 overflow-y-auto">
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between items-center border-b pb-2">
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{item.name}</p>
                    <p className="text-xs text-gray-400">@{item.numeric_price || item.price} บาท</p>
                  </div>
                  <div className="flex items-center space-y-0 space-x-2">
                    <button onClick={() => updateQuantity(item.id, -1)} className="px-2 py-0.5 bg-gray-200 rounded font-bold">-</button>
                    <span className="text-sm font-semibold">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="px-2 py-0.5 bg-gray-200 rounded font-bold">+</button>
                  </div>
                  <span className="font-bold text-sm w-16 text-right">
                    {((item.numeric_price || item.price || 0) * item.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* ฟอร์มข้อมูลผู้สั่งซื้อ */}
          <div className="space-y-3 pt-4 border-t">
            <h3 className="font-bold text-md">👤 ข้อมูลผู้สั่งซื้อ / จอง</h3>
            <div>
              <label className="text-xs text-gray-500">ชื่อลูกค้า *</label>
              <input
                type="text"
                placeholder="กรอกชื่อลูกค้า"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full p-2 border rounded-lg text-sm mt-1"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">เบอร์โทรศัพท์ *</label>
              <input
                type="text"
                placeholder="กรอกเบอร์โทรศัพท์"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full p-2 border rounded-lg text-sm mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-500">วันที่ใช้บริการ *</label>
                <input
                  type="date"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full p-2 border rounded-lg text-sm mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">เวลา *</label>
                <input
                  type="time"
                  value={bookingTime}
                  onChange={(e) => setBookingTime(e.target.value)}
                  className="w-full p-2 border rounded-lg text-sm mt-1"
                />
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full mt-4 bg-[#8b5a2b] hover:bg-[#724820] text-white py-3 rounded-xl font-bold shadow-md transition disabled:opacity-50"
            >
              {loading ? 'กำลังบันทึกข้อมูล...' : `ชำระเงิน / ยืนยันการจอง (฿${totalPrice.toLocaleString()})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
