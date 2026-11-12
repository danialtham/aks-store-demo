import { afterEach, describe, it, expect, vi } from "vitest"
import { trackAddToCart, CART_EVENT_PATH } from "@/telemetry"

describe("trackAddToCart", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it("sends a beacon with productId and quantity in the query string", () => {
    const sendBeacon = vi.fn().mockReturnValue(true)
    vi.stubGlobal("navigator", { ...navigator, sendBeacon })
    const fetchSpy = vi.fn()
    vi.stubGlobal("fetch", fetchSpy)

    trackAddToCart(7, 3)

    expect(sendBeacon).toHaveBeenCalledWith(`${CART_EVENT_PATH}?productId=7&quantity=3`)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it("falls back to a keepalive POST when sendBeacon is unavailable", () => {
    vi.stubGlobal("navigator", { ...navigator, sendBeacon: undefined })
    const fetchSpy = vi.fn().mockResolvedValue(new Response(null, { status: 204 }))
    vi.stubGlobal("fetch", fetchSpy)

    trackAddToCart("abc&x=1", 1)

    expect(fetchSpy).toHaveBeenCalledWith(
      `${CART_EVENT_PATH}?productId=abc%26x%3D1&quantity=1`,
      { method: "POST", keepalive: true },
    )
  })

  it("never throws when the transport fails", () => {
    vi.stubGlobal("navigator", {
      ...navigator,
      sendBeacon: () => {
        throw new Error("boom")
      },
    })
    expect(() => trackAddToCart(1, 1)).not.toThrow()
  })
})
