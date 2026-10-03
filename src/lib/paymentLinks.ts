import { AgencyPaymentLink, Invoice, Subscription } from '../types';

/**
 * Builds the appropriate redirect URL when client clicks "Pay now".
 * - For WHATSAPP: strips query params, builds click-to-chat URL with pre-filled invoice message
 * - For EMAIL: if mailto: link, appends subject and pre-filled body
 * - For other platforms (INSTAGRAM, X, PAYPAL, TELEGRAM, CUSTOM): returns raw url as-is
 */
export function buildPaymentRedirectUrl(
  link: AgencyPaymentLink,
  invoice?: Invoice | null,
  subscription?: Subscription | null
): string {
  if (!link || !link.url) return '#';

  const rawUrl = link.url.trim();

  // If no invoice available, fallback to plain URL
  const invoiceNumber = invoice?.invoice_number || (subscription ? `SUB-${subscription.id.slice(0, 6).toUpperCase()}` : 'RENEWAL');
  const amountFormatted = invoice 
    ? `$${(invoice.total_cents / 100).toFixed(2).replace(/\.00$/, '')}`
    : subscription 
      ? `$${(subscription.recurring_fee_cents / 100).toFixed(2).replace(/\.00$/, '')}` 
      : '$0';
  const dueDate = invoice?.due_date || subscription?.next_billing_date || 'soon';

  const messageText = `Hi, this is regarding my VectorOps invoice ${invoiceNumber} (${amountFormatted} due ${dueDate}). I'd like to pay now.`;

  // 1. WhatsApp click-to-chat format
  if (link.platform === 'WHATSAPP') {
    // Strip any existing query string or hash
    const baseUrl = rawUrl.split('?')[0].split('#')[0].replace(/\/+$/, '');
    return `${baseUrl}?text=${encodeURIComponent(messageText)}`;
  }

  // 2. Email mailto: format
  if (link.platform === 'EMAIL') {
    if (rawUrl.toLowerCase().startsWith('mailto:')) {
      const emailBase = rawUrl.split('?')[0];
      const subject = `Invoice ${invoiceNumber}`;
      return `${emailBase}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(messageText)}`;
    }
  }

  // 3. For any other platform, return raw URL as-is
  return rawUrl;
}

/**
 * Builds the appropriate redirect URL when visitor clicks "Talk to us" or consultation CTAs.
 * - For WHATSAPP: strips query params, builds click-to-chat URL with general business inquiry text
 * - For EMAIL: if mailto: link, appends subject and general inquiry body
 * - For other platforms (INSTAGRAM, X, TELEGRAM, CUSTOM): returns raw url as-is
 */
export function buildGeneralInquiryRedirectUrl(
  link: Pick<AgencyPaymentLink, 'platform' | 'url'>
): string {
  if (!link || !link.url) return '#';
  const rawUrl = link.url.trim();
  const inquiryText = "Hi, I'm interested in VectorOps' AI voice agent service for my business. Can we talk?";

  // 1. WhatsApp click-to-chat format
  if (link.platform === 'WHATSAPP') {
    const baseUrl = rawUrl.split('?')[0].split('#')[0].replace(/\/+$/, '');
    return `${baseUrl}?text=${encodeURIComponent(inquiryText)}`;
  }

  // 2. Email mailto: format
  if (link.platform === 'EMAIL') {
    if (rawUrl.toLowerCase().startsWith('mailto:')) {
      const emailBase = rawUrl.split('?')[0];
      const subject = "Inquiry: VectorOps AI voice agent service";
      return `${emailBase}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(inquiryText)}`;
    }
  }

  // 3. Return raw URL as-is for other platforms
  return rawUrl;
}
