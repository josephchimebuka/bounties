"use client"

import Link from "next/link"
import { SearchCommand } from "@/components/search-command"
import { usePathname } from "next/navigation"

export function GlobalNavbar() {
    const pathname = usePathname()

    // Optional: Hide navbar on specific paths if needed, e.g. if root is strictly login
    // if (pathname === '/') return null 

    return (
        <nav className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full">
            <div className="container flex h-14 max-w-screen-2xl items-center justify-between px-4">
                <div className="flex items-center gap-6 md:gap-8">
                    <Link href="/" className="flex items-center gap-2 font-bold pointer-events-auto">
                        <span className="text-xl tracking-tight">Bounties</span>
                    </Link>

                    <div className="hidden md:flex items-center gap-6 text-sm font-medium">
                        <Link href="/bounty" className={pathname?.startsWith('/bounty') ? "text-foreground" : "text-foreground/60 transition-colors hover:text-foreground"}>
                            Explore
                        </Link>
                        <Link href="/projects" className={pathname?.startsWith('/projects') ? "text-foreground" : "text-foreground/60 transition-colors hover:text-foreground"}>
                            Projects
                        </Link>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <SearchCommand />
                </div>
            </div>
        </nav>
    )
}
