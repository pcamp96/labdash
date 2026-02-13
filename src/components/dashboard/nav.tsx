"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, Settings, LogOut, Server } from "lucide-react"
import { cn } from "@/lib/utils"

interface DashboardNavProps {
  user: {
    name?: string | null
    email?: string
    role?: string
  }
}

export function DashboardNav({ user }: DashboardNavProps) {
  const pathname = usePathname()

  const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Services", href: "/services", icon: Server },
    { name: "Settings", href: "/settings", icon: Settings },
  ]

  return (
    <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2">
              <Server className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">LabDash</span>
            </Link>
            <div className="flex space-x-4">
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive
                        ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-slate-600 dark:text-slate-400">
              {user.name || user.email}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
