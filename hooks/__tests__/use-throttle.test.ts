import { renderHook, act } from "@testing-library/react"
import { useThrottle } from "../use-throttle"

describe("useThrottle", () => {
    beforeEach(() => {
        jest.useFakeTimers()
    })

    afterEach(() => {
        jest.useRealTimers()
    })

    it("should return initial value immediately", () => {
        const { result } = renderHook(() => useThrottle("test", 1000))
        expect(result.current).toBe("test")
    })

    it("should throttle updates", () => {
        const { result, rerender } = renderHook(
            ({ value }) => useThrottle(value, 1000),
            { initialProps: { value: "start" } }
        )

        // Update immediately
        rerender({ value: "update1" })

        // Should not update yet (if interval hasn't passed)
        // Actually our implementation updates on effect based on time diff.
        // Effect runs after render.

        // Our useThrottle logic:
        // 1. Initial render -> state = "start", lastRan = 0 -> current time.
        // 2. Rerender "update1" -> effect runs.
        //    if Date.now() - lastRan >= limit ? No.
        //    setTimeout(..., limit - diff).

        expect(result.current).toBe("start")

        // Advance 500ms
        act(() => {
            jest.advanceTimersByTime(500)
        })
        expect(result.current).toBe("start")

        // Advance past limit
        act(() => {
            jest.advanceTimersByTime(501)
        })

        expect(result.current).toBe("update1")
    })

    it("should execute trailing update", () => {
        const { result, rerender } = renderHook(
            ({ value }) => useThrottle(value, 1000),
            { initialProps: { value: "start" } }
        )

        rerender({ value: "update1" })
        rerender({ value: "update2" })

        act(() => {
            jest.runAllTimers()
        })

        expect(result.current).toBe("update2")
    })
})
