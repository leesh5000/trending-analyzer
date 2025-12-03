"use client"

import * as React from "react"
import { Moon, Sun, Monitor } from "lucide-react"
import { useTheme } from "next-themes"

export function ThemeToggle() {
    const { setTheme, theme, resolvedTheme } = useTheme()
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return (
            <div className="w-9 h-9 bg-zinc-100 dark:bg-zinc-800 rounded-lg animate-pulse" />
        )
    }

    const toggleTheme = () => {
        // If current is system, resolve to actual theme then toggle
        const current = theme === 'system' ? resolvedTheme : theme
        setTheme(current === 'dark' ? 'light' : 'dark')
    }

    // Show icon based on resolved theme (so system-dark shows moon)
    const Icon = (theme === 'system' ? resolvedTheme : theme) === 'dark' ? Moon : Sun

    return (
        <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            title={`Current theme: ${theme}`}
        >
            <Icon size={18} />
        </button>
    )
}
