import { Booking, AgencySettings, Vehicle } from '../types';

export function formatWhatsAppNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `91${digits}`;
  }
  return digits;
}

export function generateBookingWhatsAppUrl(
  booking: Booking,
  agency: AgencySettings
): string {
  const phone = formatWhatsAppNumber(agency.whatsapp_number);
  const text = encodeURIComponent(
    `🚖 *NEW CAB BOOKING - ${agency.agency_name}*\n` +
    `----------------------------------\n` +
    `📌 *Booking ID:* ${booking.booking_code}\n` +
    `👤 *Name:* ${booking.customer_name}\n` +
    `📞 *Phone:* ${booking.customer_phone}\n` +
    `🚐 *Car:* ${booking.vehicle_name}\n` +
    `📍 *Pickup:* ${booking.pickup_location}\n` +
    `🏁 *Destination:* ${booking.drop_location}\n` +
    `📅 *Date:* ${booking.travel_date} ${booking.pickup_time ? `(${booking.pickup_time})` : ''}\n` +
    `💰 *Estimated Fare:* ₹${booking.estimated_price.toLocaleString('en-IN')}\n` +
    `----------------------------------\n` +
    `Please confirm car availability and driver details.`
  );
  return `https://wa.me/${phone}?text=${text}`;
}

export function generateVehicleInquiryWhatsAppUrl(
  vehicle: Vehicle,
  pickup: string,
  drop: string,
  travelDate: string,
  agency: AgencySettings
): string {
  const phone = formatWhatsAppNumber(agency.whatsapp_number);
  const text = encodeURIComponent(
    `Hello *${agency.agency_name}*, I want to inquire about *${vehicle.name}*:\n` +
    `- *Pickup:* ${pickup || 'Bhubaneswar'}\n` +
    `- *Destination:* ${drop || 'Puri'}\n` +
    `- *Date:* ${travelDate || 'Tomorrow'}\n` +
    `- *Rate:* ₹${vehicle.price}/${vehicle.price_unit}\n` +
    `Is this car available? Please share final fare.`
  );
  return `https://wa.me/${phone}?text=${text}`;
}

export function generateAdminReplyWhatsAppUrl(
  booking: Booking,
  agency: AgencySettings
): string {
  const phone = formatWhatsAppNumber(booking.customer_phone);
  const text = encodeURIComponent(
    `Hello *${booking.customer_name}*, thank you for choosing *${agency.agency_name}*!\n` +
    `Regarding your cab request for *${booking.vehicle_name}* on *${booking.travel_date}* (${booking.pickup_location} → ${booking.drop_location}):\n` +
    `Your ride is confirmed. For assistance, call us at ${agency.phone_primary}.`
  );
  return `https://wa.me/${phone}?text=${text}`;
}
