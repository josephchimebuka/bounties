import { renderHook, act } from "@testing-library/react"
import { useMediaQuery } from "../use-media-query"

describe("useMediaQuery", () => {
    const matchMediaMock = jest.fn()

    beforeAll(() => {
        Object.defineProperty(window, "matchMedia", {
            writable: true,
            value: matchMediaMock,
        })
    })

    beforeEach(() => {
        matchMediaMock.mockClear()
    })

    it("should return true if media matches", () => {
        matchMediaMock.mockReturnValue({
            matches: true,
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
        })

        const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"))
        expect(result.current).toBe(true)
    })

    it("should return false if media does not match", () => {
        matchMediaMock.mockReturnValue({
            matches: false,
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
        })

        const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"))
        expect(result.current).toBe(false)
    })

    it("should update when media query changes", () => {
        let changeHandler: () => void = () => { }

        matchMediaMock.mockReturnValue({
            matches: false,
            addEventListener: jest.fn((event, handler) => {
                changeHandler = handler
            }),
            removeEventListener: jest.fn(),
        })

        const { result } = renderHook(() => useMediaQuery("(min-width: 768px)"))
        expect(result.current).toBe(false)

        act(() => {
            matchMediaMock.mockReturnValue({
                matches: true,
                addEventListener: jest.fn(),
                removeEventListener: jest.fn(),
            })
            changeHandler()
        })

        expect(result.current).toBe(true)
    })
})
