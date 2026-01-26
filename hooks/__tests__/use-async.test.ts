import { renderHook, act, waitFor } from "@testing-library/react"
import { useAsync } from "../use-async"

describe("useAsync", () => {
    it("should initialize with idle status", () => {
        const { result } = renderHook(() => useAsync(async () => { }, false))
        expect(result.current.status).toBe("idle")
        expect(result.current.value).toBeNull()
        expect(result.current.error).toBeNull()
    })

    it("should execute immediately if immediate is true (default)", async () => {
        const asyncFn = jest.fn().mockResolvedValue("success")
        const { result } = renderHook(() => useAsync(asyncFn, true))

        expect(result.current.status).toBe("pending")

        await waitFor(() => {
            expect(result.current.status).toBe("success")
        })

        expect(result.current.value).toBe("success")
    })

    it("should handle errors", async () => {
        const errorMsg = "failed"
        const asyncFn = jest.fn().mockRejectedValue(errorMsg)
        const { result } = renderHook(() => useAsync(asyncFn, false))

        act(() => {
            result.current.execute()
        })

        expect(result.current.status).toBe("pending")

        await waitFor(() => {
            expect(result.current.status).toBe("error")
        })

        expect(result.current.error).toBe(errorMsg)
    })

    it("should allow manual execution", async () => {
        const asyncFn = jest.fn().mockResolvedValue("data")
        const { result } = renderHook(() => useAsync(asyncFn, false))

        act(() => {
            result.current.execute()
        })

        await waitFor(() => {
            expect(result.current.status).toBe("success")
        })

        expect(result.current.value).toBe("data")
    })
})
