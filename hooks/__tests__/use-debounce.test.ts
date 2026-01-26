import { renderHook, act } from "@testing-library/react"
import { useDebounce } from "../use-debounce"

describe("useDebounce", () => {
    beforeAll(() => {
        jest.useFakeTimers()
    })

    afterAll(() => {
        jest.useRealTimers()
    })

    it("should return initial value immediately", () => {
        const { result } = renderHook(() => useDebounce("test", 500))
        expect(result.current).toBe("test")
    })

    it("should debounce value updates", () => {
        const { result, rerender } = renderHook(
            ({ value }) => useDebounce(value, 500),
            { initialProps: { value: "initial" } }
        )

        // Update value
        rerender({ value: "updated" })

        // Should stay initial immediately
        expect(result.current).toBe("initial")

        // Advance time partly
        act(() => {
            jest.advanceTimersByTime(400)
        })
        expect(result.current).toBe("initial")

        // Advance finished
        act(() => {
            jest.advanceTimersByTime(100)
        })
        expect(result.current).toBe("updated")
    })

    it("should cancel timeout on unmount", () => {
        const { unmount, rerender } = renderHook(
            ({ value }) => useDebounce(value, 500),
            { initialProps: { value: "test" } }
        )

        rerender({ value: "test2" })
        unmount()

        // Ensure no errors/warnings from timers running after unmount
        act(() => {
            jest.runAllTimers()
        })
    })
})
