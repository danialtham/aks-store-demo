// Fire-and-forget beacon so "add to cart" becomes observable server-side.
//
// The cart lives entirely in the browser (Pinia + localStorage), so without this
// there is no request to log. nginx answers /api/events/cart locally with 204 (no
// backend hop) and its access log records the request line, which is why the
// productId/quantity travel in the query string rather than the body.
//
// Telemetry must never break the shopping experience: every failure is swallowed.
export const CART_EVENT_PATH = '/api/events/cart'

export function trackAddToCart(productId: number | string, quantity: number): void {
  try {
    const qs = new URLSearchParams({
      productId: String(productId),
      quantity: String(quantity),
    })
    const url = `${CART_EVENT_PATH}?${qs.toString()}`

    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      if (navigator.sendBeacon(url)) return
    }
    if (typeof fetch === 'function') {
      void fetch(url, { method: 'POST', keepalive: true }).catch(() => undefined)
    }
  } catch {
    // ignore - telemetry is best effort
  }
}
