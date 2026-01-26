import { renderHook, act } from "@testing-library/react"
import { useClickOutside } from "../use-click-outside"

describe("useClickOutside", () => {
    let addEventListenerSpy: jest.SpyInstance
    let removeEventListenerSpy: jest.SpyInstance

    beforeEach(() => {
        addEventListenerSpy = jest.spyOn(document, "addEventListener")
        removeEventListenerSpy = jest.spyOn(document, "removeEventListener")
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    it("should add event listeners on mount", () => {
        const ref = { current: document.createElement("div") }
        renderHook(() => useClickOutside(ref, jest.fn()))
        expect(addEventListenerSpy).toHaveBeenCalledWith("mousedown", expect.any(Function))
        expect(addEventListenerSpy).toHaveBeenCalledWith("touchstart", expect.any(Function))
    })

    it("should remove event listeners on unmount", () => {
        const ref = { current: document.createElement("div") }
        const { unmount } = renderHook(() => useClickOutside(ref, jest.fn()))
        unmount()
        expect(removeEventListenerSpy).toHaveBeenCalledWith("mousedown", expect.any(Function))
        expect(removeEventListenerSpy).toHaveBeenCalledWith("touchstart", expect.any(Function))
    })

    it("should call handler when clicking outside", () => {
        const handler = jest.fn()
        const ref = { current: document.createElement("div") }
        document.body.appendChild(ref.current)

        renderHook(() => useClickOutside(ref, handler))

        // Simulate click outside
        act(() => {
            document.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }))
        })

        expect(handler).toHaveBeenCalled()

        document.body.removeChild(ref.current)
    })

    it("should not call handler when clicking inside", () => {
        const handler = jest.fn()
        const ref = { current: document.createElement("div") }
        document.body.appendChild(ref.current)

        renderHook(() => useClickOutside(ref, handler))

        // Simulate click inside
        act(() => {
            ref.current.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }))
        })

        expect(handler).not.toHaveBeenCalled()

        document.body.removeChild(ref.current)
    })
})
