import { renderHook, act } from "@testing-library/react"
import { useLocalStorage } from "../use-local-storage"

describe("useLocalStorage", () => {
    beforeEach(() => {
        window.localStorage.clear()
        jest.clearAllMocks()
    })

    it("should return initial value if storage is empty", () => {
        const { result } = renderHook(() => useLocalStorage("key", "initial"))
        expect(result.current[0]).toBe("initial")
    })

    it("should return stored value if exists", () => {
        window.localStorage.setItem("key", JSON.stringify("stored"))
        const { result } = renderHook(() => useLocalStorage("key", "initial"))
        expect(result.current[0]).toBe("stored")
    })

    it("should update storage when state changes", () => {
        const { result } = renderHook(() => useLocalStorage("key", "initial"))

        act(() => {
            result.current[1]("new-value")
        })

        expect(result.current[0]).toBe("new-value")
        expect(window.localStorage.getItem("key")).toBe(JSON.stringify("new-value"))
    })

    it("should handle function updates", () => {
        const { result } = renderHook(() => useLocalStorage("count", 1))

        act(() => {
            result.current[1]((prev) => prev + 1)
        })

        expect(result.current[0]).toBe(2)
        expect(window.localStorage.getItem("count")).toBe(JSON.stringify(2))
    })

    it("should handle error gracefully", () => {
        const consoleSpy = jest.spyOn(console, "warn").mockImplementation(() => { })

        // Simulate error by mocking setItem
        jest.spyOn(window.localStorage, "setItem").mockImplementation(() => {
            throw new Error("QuotaExceeded")
        })

        const { result } = renderHook(() => useLocalStorage("key", "value"))

        act(() => {
            result.current[1]("new-value")
        })

        // Should still update state even if storage fails
        expect(result.current[0]).toBe("new-value")
        // Should warn
        expect(consoleSpy).toHaveBeenCalledWith(
            expect.stringContaining("Error setting localStorage"),
            expect.any(Error)
        )

        consoleSpy.mockRestore()
    })
})
