import { Booking, AgencySettings, Vehicle } from '../types';

export function formatWhatsAppNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `91${digits}`;
  }
  return digits;
}

// 1. Sent by User to Agency WhatsApp on placing booking
export function generateBookingWhatsAppUrl(
  booking: Booking,
  agency: AgencySettings
): string {
  const phone = formatWhatsAppNumber(agency.whatsapp_number);
  const text = encodeURIComponent(
    `🚖 *NEW CAB BOOKING REQUEST - ${agency.agency_name}*\n` +
    `----------------------------------\n` +
    `📌 *Booking ID:* ${booking.booking_code}\n` +
    `👤 *Customer Name:* ${booking.customer_name}\n` +
    `📞 *Registered Mobile:* ${booking.customer_phone}\n` +
    `🚐 *Car Requested:* ${booking.vehicle_name}\n` +
    `📍 *Pickup:* ${booking.pickup_location}\n` +
    `🏁 *Destination:* ${booking.drop_location}\n` +
    `📅 *Travel Date:* ${booking.travel_date} ${booking.pickup_time ? `(${booking.pickup_time})` : ''}\n` +
    (booking.special_notes ? `📝 *Notes:* ${booking.special_notes}\n` : '') +
    `⏳ *Status:* PENDING CONFIRMATION\n` +
    `----------------------------------\n` +
    `Please confirm my ride and send driver details.`
  );
  return `https://wa.me/${phone}?text=${text}`;
}

// 2. Sent by User for car inquiry
export function generateVehicleInquiryWhatsAppUrl(
  vehicle: Vehicle,
  pickup: string,
  drop: string,
  travelDate: string,
  agency: AgencySettings
): string {
  const phone = formatWhatsAppNumber(agency.whatsapp_number);
  const text = encodeURIComponent(
    `Hello *${agency.agency_name}*, I want to inquire about *${vehicle.name}* (${vehicle.seating_capacity} Seater ${vehicle.is_ac ? 'AC' : 'Non-AC'}):\n` +
    `- *Pickup:* ${pickup || 'Bhubaneswar'}\n` +
    `- *Destination:* ${drop || 'Puri'}\n` +
    `- *Date:* ${travelDate || 'Tomorrow'}\n` +
    `Is this car available? Please share quote and availability.`
  );
  return `https://wa.me/${phone}?text=${text}`;
}

// 3. Sent by Admin to User WhatsApp to CONFIRM the booking
export function generateAdminBookingConfirmationWhatsAppUrl(
  booking: Booking,
  agency: AgencySettings
): string {
  const phone = formatWhatsAppNumber(booking.customer_phone);
  const text = encodeURIComponent(
    `✅ *BOOKING CONFIRMED - ${agency.agency_name.toUpperCase()}*\n` +
    `----------------------------------\n` +
    `Dear *${booking.customer_name}*,\n` +
    `Your cab booking has been *CONFIRMED* by our dispatch team!\n\n` +
    `📌 *Booking ID:* ${booking.booking_code}\n` +
    `🚐 *Vehicle:* ${booking.vehicle_name}\n` +
    `📍 *Pickup Location:* ${booking.pickup_location}\n` +
    `🏁 *Destination:* ${booking.drop_location}\n` +
    `📅 *Date & Time:* ${booking.travel_date} ${booking.pickup_time ? `at ${booking.pickup_time}` : ''}\n` +
    (booking.special_notes ? `📝 *Special Request:* ${booking.special_notes}\n` : '') +
    `----------------------------------\n` +
    `🚖 *Driver Details:* Driver name & vehicle number will be shared before pickup time.\n` +
    `📞 *Helpline / Support:* ${agency.phone_primary}\n` +
    `📍 *Office:* ${agency.address}, ${agency.city}\n\n` +
    `Thank you for choosing *${agency.agency_name}*! Have a safe journey.`
  );
  return `https://wa.me/${phone}?text=${text}`;
}

// Alias for backward compatibility
export const generateAdminReplyWhatsAppUrl = generateAdminBookingConfirmationWhatsAppUrl;
