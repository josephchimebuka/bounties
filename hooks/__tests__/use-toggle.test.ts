import { renderHook, act } from "@testing-library/react"
import { useToggle } from "../use-toggle"

describe("useToggle", () => {
    it("should initialize with default value (false)", () => {
        const { result } = renderHook(() => useToggle())
        expect(result.current[0]).toBe(false)
    })

    it("should initialize with provided value", () => {
        const { result } = renderHook(() => useToggle(true))
        expect(result.current[0]).toBe(true)
    })

    it("should toggle value", () => {
        const { result } = renderHook(() => useToggle(false))

        act(() => {
            result.current[1]()
        })
        expect(result.current[0]).toBe(true)

        act(() => {
            result.current[1]()
        })
        expect(result.current[0]).toBe(false)
    })

    it("should maintain identity of toggle function", () => {
        const { result } = renderHook(() => useToggle())
        const toggle1 = result.current[1]

        act(() => {
            result.current[1]()
        })

        const toggle2 = result.current[1]
        expect(toggle1).toBe(toggle2)
    })
})
